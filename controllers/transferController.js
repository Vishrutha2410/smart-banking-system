import mongoose from "mongoose";

import Transfer from "../models/Transfer.js";
import Account from "../models/Account.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { notify } from "../services/notificationService.js";

/*
 * ============================================================
 * REFERENCE NUMBER HELPERS
 * ============================================================
 */

const generateReferenceNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000);

  return `TRF${timestamp}${random}`;
};

const generateTransactionReference = () => {
  const timestamp = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000);

  return `TXN${timestamp}${random}`;
};

const generateTransactionId = () => {
  if (
    typeof Transaction.generateTransactionId === "function"
  ) {
    return Transaction.generateTransactionId();
  }

  return `T${Date.now()}${Math.floor(Math.random() * 1000)}`;
};

/*
 * ============================================================
 * GET LOGGED-IN USER TRANSFERS
 * ============================================================
 */

export const getTransfers = async (req, res) => {
  try {
    const userId = req.user.id;

    const transfers = await Transfer.find({
      $or: [
        {
          sender: userId,
        },
        {
          recipient: userId,
        },
      ],
    })
      .populate(
        "sender",
        "name email phone"
      )
      .populate(
        "recipient",
        "name email phone"
      )
      .populate(
        "fromAccount",
        "accountNumber accountType balance currency ifsc upiId"
      )
      .populate(
        "toAccount",
        "accountNumber accountType balance currency ifsc upiId"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      transfers,
    });
  } catch (error) {
    console.error(
      "Get transfers error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch transfers.",
    });
  }
};

/*
 * ============================================================
 * CREATE TRANSFER
 * ============================================================
 *
 * Supported:
 *
 * UPI
 * IMPS
 * NEFT
 * RTGS
 * SELF
 *
 * IMPORTANT:
 *
 * For transfers between accounts/users inside this
 * Smart Banking System:
 *
 * Sender:
 *   - balance decreases
 *
 * Receiver:
 *   - balance increases
 *
 * Transfer:
 *   - recipient is saved
 *   - toAccount is saved
 *
 * Transactions:
 *   - sender gets TRANSFER expense
 *   - receiver gets TRANSFER income
 *
 * Notifications:
 *   - sender receives in-app notification
 *   - sender receives email notification
 *   - receiver receives in-app notification
 *   - receiver receives email notification
 *
 * Email sending is handled inside notificationService.js.
 */

export const createTransfer = async (
  req,
  res
) => {
  let sourceAccount = null;
  let destinationAccount = null;

  let originalSourceBalance = null;
  let originalDestinationBalance = null;

  let createdTransfer = null;
  let createdSenderTransaction = null;
  let createdReceiverTransaction = null;

  try {
    const userId = req.user.id;

    /*
     * ========================================================
     * GET SENDER USER
     * ========================================================
     */

    const senderUser = await User.findById(userId).select(
      "name email"
    );

    if (!senderUser) {
      return res.status(404).json({
        success: false,
        message: "Sender user was not found.",
      });
    }

    const {
      transferType,
      fromAccountId,
      recipientAccountNumber,
      recipientName,
      recipientIfsc,
      recipientUpiId,
      toAccountId,
      amount,
      description,
    } = req.body;

    /*
     * ========================================================
     * BASIC VALIDATION
     * ========================================================
     */

    const allowedTransferTypes = [
      "UPI",
      "IMPS",
      "NEFT",
      "RTGS",
      "SELF",
    ];

    if (
      !transferType ||
      !allowedTransferTypes.includes(transferType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid transfer type.",
      });
    }

    if (!fromAccountId) {
      return res.status(400).json({
        success: false,
        message: "Source account is required.",
      });
    }

    const transferAmount = Number(amount);

    if (
      !Number.isFinite(transferAmount) ||
      transferAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero.",
      });
    }

    /*
     * ========================================================
     * VALIDATE SOURCE ACCOUNT ID
     * ========================================================
     */

    if (
      !mongoose.isValidObjectId(fromAccountId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid source account.",
      });
    }

    /*
     * ========================================================
     * FIND SOURCE ACCOUNT
     * ========================================================
     *
     * The source account MUST belong to the
     * currently logged-in user.
     */

    sourceAccount = await Account.findOne({
      _id: fromAccountId,
      user: userId,
    });

    if (!sourceAccount) {
      return res.status(404).json({
        success: false,
        message: "Source account not found.",
      });
    }

    /*
     * ========================================================
     * SOURCE ACCOUNT STATUS
     * ========================================================
     */

    if (
      String(sourceAccount.status).toLowerCase() !==
      "active"
    ) {
      return res.status(400).json({
        success: false,
        message: "Source account is not active.",
      });
    }

    /*
     * ========================================================
     * SOURCE BALANCE CHECK
     * ========================================================
     */

    if (
      Number(sourceAccount.balance) <
      transferAmount
    ) {
      return res.status(400).json({
        success: false,
        message: "Insufficient account balance.",
      });
    }

    /*
     * ========================================================
     * RECIPIENT VARIABLES
     * ========================================================
     */

    let recipientUser = null;

    /*
     * ========================================================
     * UPI TRANSFER
     * ========================================================
     *
     * 1. Normalize UPI ID.
     * 2. Find destination account.
     * 3. Find recipient user.
     * 4. Check recipient account.
     * 5. Check recipient user.
     */

    if (transferType === "UPI") {
      const normalizedUpiId = String(
        recipientUpiId || ""
      )
        .trim()
        .toLowerCase();

      if (!normalizedUpiId) {
        return res.status(400).json({
          success: false,
          message: "Recipient UPI ID is required.",
        });
      }

      /*
       * FIND FRIEND'S ACCOUNT BY UPI ID
       */

      destinationAccount =
        await Account.findOne({
          upiId: normalizedUpiId,
        });

      /*
       * Never debit sender if UPI ID
       * doesn't belong to an account.
       */

      if (!destinationAccount) {
        return res.status(404).json({
          success: false,
          message:
            "No active account was found for this UPI ID.",
        });
      }

      /*
       * Receiver cannot be the same account.
       */

      if (
        String(destinationAccount._id) ===
        String(sourceAccount._id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot transfer money to the same account.",
        });
      }

      /*
       * Receiver account must be active.
       */

      if (
        String(destinationAccount.status).toLowerCase() !==
        "active"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Recipient account is not active.",
        });
      }

      /*
       * FIND RECEIVER USER
       */

      recipientUser = await User.findById(
        destinationAccount.user
      ).select("name email isActive");

      if (!recipientUser) {
        return res.status(404).json({
          success: false,
          message: "Recipient user was not found.",
        });
      }

      /*
       * Receiver user must be active.
       */

      if (
        recipientUser.isActive === false
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Recipient user account is inactive.",
        });
      }
    }

    /*
     * ========================================================
     * IMPS / NEFT / RTGS
     * ========================================================
     *
     * If the recipient account exists inside our system,
     * the money will also be credited.
     *
     * If it is an external bank account, only the transfer
     * record is stored because this project cannot actually
     * send money through an external banking network.
     */

    if (
      transferType === "IMPS" ||
      transferType === "NEFT" ||
      transferType === "RTGS"
    ) {
      const cleanRecipientName =
        String(recipientName || "").trim();

      const cleanRecipientAccount =
        String(
          recipientAccountNumber || ""
        ).trim();

      const cleanRecipientIfsc =
        String(recipientIfsc || "")
          .trim()
          .toUpperCase();

      if (!cleanRecipientName) {
        return res.status(400).json({
          success: false,
          message: "Recipient name is required.",
        });
      }

      if (!cleanRecipientAccount) {
        return res.status(400).json({
          success: false,
          message:
            "Recipient account number is required.",
        });
      }

      if (!cleanRecipientIfsc) {
        return res.status(400).json({
          success: false,
          message:
            "Recipient IFSC code is required.",
        });
      }

      /*
       * Try to find recipient in our own
       * Smart Banking System.
       */

      destinationAccount =
        await Account.findOne({
          accountNumber:
            cleanRecipientAccount,
        });

      if (destinationAccount) {
        /*
         * Don't allow transfer to an inactive account.
         */

        if (
          String(destinationAccount.status).toLowerCase() !==
          "active"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Recipient account is not active.",
          });
        }

        /*
         * Don't allow same account.
         */

        if (
          String(destinationAccount._id) ===
          String(sourceAccount._id)
        ) {
          return res.status(400).json({
            success: false,
            message:
              "You cannot transfer money to the same account.",
          });
        }

        recipientUser =
          await User.findById(
            destinationAccount.user
          ).select("name email isActive");

        if (!recipientUser) {
          return res.status(404).json({
            success: false,
            message:
              "Recipient user was not found.",
          });
        }

        if (
          recipientUser.isActive === false
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Recipient user account is inactive.",
          });
        }
      }
    }

    /*
     * ========================================================
     * SELF TRANSFER
     * ========================================================
     */

    if (transferType === "SELF") {
      if (!toAccountId) {
        return res.status(400).json({
          success: false,
          message:
            "Destination account is required.",
        });
      }

      if (
        !mongoose.isValidObjectId(
          toAccountId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid destination account.",
        });
      }

      if (
        String(toAccountId) ===
        String(fromAccountId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Source and destination accounts must be different.",
        });
      }

      destinationAccount =
        await Account.findOne({
          _id: toAccountId,
          user: userId,
        });

      if (!destinationAccount) {
        return res.status(404).json({
          success: false,
          message:
            "Destination account not found.",
        });
      }

      if (
        String(destinationAccount.status).toLowerCase() !==
        "active"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Destination account is not active.",
        });
      }

      /*
       * SELF transfer belongs to the same user.
       */

      recipientUser = senderUser;
    }

    /*
     * ========================================================
     * IMPORTANT SAFETY CHECK
     * ========================================================
     *
     * For UPI and SELF transfers, a destination account MUST
     * exist before we debit the sender.
     */

    if (
      (transferType === "UPI" ||
        transferType === "SELF") &&
      !destinationAccount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Destination account could not be found.",
      });
    }

    /*
     * ========================================================
     * SAVE ORIGINAL BALANCES
     * ========================================================
     *
     * These values allow rollback if something fails later.
     */

    originalSourceBalance =
      Number(sourceAccount.balance);

    if (destinationAccount) {
      originalDestinationBalance =
        Number(destinationAccount.balance);
    }

    /*
     * ========================================================
     * DEBIT SOURCE ACCOUNT
     * ========================================================
     */

    sourceAccount.balance =
      originalSourceBalance -
      transferAmount;

    await sourceAccount.save();

    /*
     * ========================================================
     * CREDIT DESTINATION ACCOUNT
     * ========================================================
     */

    if (destinationAccount) {
      destinationAccount.balance =
        originalDestinationBalance +
        transferAmount;

      await destinationAccount.save();
    }

    /*
     * ========================================================
     * CREATE TRANSFER DOCUMENT
     * ========================================================
     */

    const cleanUpiId =
      String(recipientUpiId || "")
        .trim()
        .toLowerCase();

    const cleanRecipientName =
      String(recipientName || "").trim();

    const cleanRecipientAccount =
      String(
        recipientAccountNumber || ""
      ).trim();

    const cleanRecipientIfsc =
      String(recipientIfsc || "")
        .trim()
        .toUpperCase();

    /*
     * For internal transfers, always take the receiver's
     * actual information from Account/User.
     *
     * This prevents "Unknown" in Admin Dashboard.
     */

    const finalRecipientName =
      destinationAccount?.fullName ||
      recipientUser?.name ||
      cleanRecipientName ||
      "";

    const finalRecipientAccount =
      destinationAccount?.accountNumber ||
      cleanRecipientAccount ||
      "";

    const finalRecipientIfsc =
      destinationAccount?.ifsc ||
      cleanRecipientIfsc ||
      "";

    const finalRecipientUpiId =
      destinationAccount?.upiId ||
      cleanUpiId ||
      "";

    createdTransfer =
      await Transfer.create({
        sender: userId,

        /*
         * Actual recipient User ID.
         */

        recipient:
          recipientUser?._id || undefined,

        fromAccount:
          sourceAccount._id,

        /*
         * Actual destination Account.
         */

        toAccount:
          destinationAccount?._id ||
          undefined,

        transferType,

        recipientName:
          finalRecipientName,

        recipientAccountNumber:
          finalRecipientAccount,

        recipientIfsc:
          finalRecipientIfsc,

        recipientUpiId:
          finalRecipientUpiId,

        amount:
          transferAmount,

        description:
          String(
            description || ""
          ).trim(),

        referenceNumber:
          generateReferenceNumber(),

        status: "Completed",
      });

    /*
     * ========================================================
     * CREATE SENDER TRANSACTION
     * ========================================================
     *
     * Transfer is NOT treated as a normal expense for
     * budgeting purposes.
     */

    createdSenderTransaction =
      await Transaction.create({
        transactionId:
          generateTransactionId(),

        user: userId,

        account:
          sourceAccount._id,

        senderAccount:
          sourceAccount._id,

        receiverAccount:
          destinationAccount?._id ||
          null,

        type: "expense",

        transactionKind:
          "TRANSFER",

        category:
          transferType === "SELF"
            ? "Own Account Transfer"
            : "Bank Transfer",

        amount:
          transferAmount,

        transferMethod:
          transferType === "SELF"
            ? "OWN_ACCOUNT"
            : transferType,

        description:
          String(
            description || ""
          ).trim() ||
          `${transferType} transfer`,

        status:
          "SUCCESS",

        referenceNumber:
          generateTransactionReference(),

        date:
          new Date(),
      });

    /*
     * ========================================================
     * CREATE RECEIVER TRANSACTION
     * ========================================================
     *
     * This makes the transfer appear in the
     * recipient's transaction history.
     */

    if (
      destinationAccount &&
      recipientUser
    ) {
      createdReceiverTransaction =
        await Transaction.create({
          transactionId:
            generateTransactionId(),

          user:
            destinationAccount.user,

          account:
            destinationAccount._id,

          senderAccount:
            sourceAccount._id,

          receiverAccount:
            destinationAccount._id,

          type: "income",

          transactionKind:
            "TRANSFER",

          category:
            transferType === "SELF"
              ? "Own Account Transfer"
              : "Bank Transfer Received",

          amount:
            transferAmount,

          transferMethod:
            transferType === "SELF"
              ? "OWN_ACCOUNT"
              : transferType,

          description:
            String(
              description || ""
            ).trim() ||
            `${transferType} transfer received`,

          status:
            "SUCCESS",

          referenceNumber:
            generateTransactionReference(),

          date:
            new Date(),
        });
    }

    /*
     * ========================================================
     * TRANSFER NOTIFICATION - SENDER
     * ========================================================
     *
     * notify() now handles:
     *
     * 1. Creating the in-app notification.
     * 2. Sending the email to the registered email address.
     *
     * Email errors are handled inside notificationService.js,
     * so email problems do not stop the transfer.
     */

    try {
      await notify(
        userId,
        "Transfer Successful",
        `₹${transferAmount.toLocaleString(
          "en-IN"
        )} has been transferred successfully via ${transferType}. Reference: ${createdTransfer.referenceNumber}.`,
        "transfer"
      );
    } catch (notificationError) {
      console.error(
        "Sender transfer notification error:",
        notificationError.message
      );
    }

    /*
     * ========================================================
     * TRANSFER NOTIFICATION - RECEIVER
     * ========================================================
     *
     * Send this only when the recipient is another user
     * inside our Smart Banking System.
     *
     * For SELF transfers, sender and receiver are the same
     * user, so we do not create a duplicate receiver email.
     */

    if (
      destinationAccount &&
      recipientUser &&
      String(recipientUser._id) !==
        String(userId)
    ) {
      try {
        await notify(
          recipientUser._id,
          "Money Received",
          `₹${transferAmount.toLocaleString(
            "en-IN"
          )} has been credited to your account from ${
            senderUser.name || "another Smart Banking user"
          }. Reference: ${createdTransfer.referenceNumber}.`,
          "transfer"
        );
      } catch (notificationError) {
        console.error(
          "Receiver transfer notification error:",
          notificationError.message
        );
      }
    }

    /*
     * ========================================================
     * GET COMPLETE TRANSFER
     * ========================================================
     */

    const populatedTransfer =
      await Transfer.findById(
        createdTransfer._id
      )
        .populate(
          "sender",
          "name email phone"
        )
        .populate(
          "recipient",
          "name email phone"
        )
        .populate(
          "fromAccount",
          "accountNumber accountType balance currency ifsc upiId"
        )
        .populate(
          "toAccount",
          "accountNumber accountType balance currency ifsc upiId"
        );

    /*
     * ========================================================
     * SUCCESS RESPONSE
     * ========================================================
     */

    return res.status(201).json({
      success: true,

      message:
        `${transferType} transfer completed successfully.`,

      transfer:
        populatedTransfer,

      senderBalance:
        Number(sourceAccount.balance),

      receiverBalance:
        destinationAccount
          ? Number(
              destinationAccount.balance
            )
          : null,
    });
  } catch (error) {
    console.error(
      "Create transfer error:",
      error
    );

    /*
     * ========================================================
     * ROLLBACK
     * ========================================================
     *
     * If something fails after the balance updates,
     * restore balances and remove partially-created documents.
     *
     * This works without requiring a MongoDB replica-set
     * transaction.
     */

    try {
      /*
       * Delete receiver transaction.
       */

      if (
        createdReceiverTransaction?._id
      ) {
        await Transaction.deleteOne({
          _id:
            createdReceiverTransaction._id,
        });
      }

      /*
       * Delete sender transaction.
       */

      if (
        createdSenderTransaction?._id
      ) {
        await Transaction.deleteOne({
          _id:
            createdSenderTransaction._id,
        });
      }

      /*
       * Delete transfer document.
       */

      if (createdTransfer?._id) {
        await Transfer.deleteOne({
          _id:
            createdTransfer._id,
        });
      }

      /*
       * Restore source balance.
       */

      if (
        sourceAccount &&
        originalSourceBalance !== null
      ) {
        await Account.updateOne(
          {
            _id:
              sourceAccount._id,
          },
          {
            $set: {
              balance:
                originalSourceBalance,
            },
          }
        );
      }

      /*
       * Restore destination balance.
       */

      if (
        destinationAccount &&
        originalDestinationBalance !== null
      ) {
        await Account.updateOne(
          {
            _id:
              destinationAccount._id,
          },
          {
            $set: {
              balance:
                originalDestinationBalance,
            },
          }
        );
      }
    } catch (rollbackError) {
      console.error(
        "Transfer rollback error:",
        rollbackError
      );
    }

    /*
     * ========================================================
     * ERROR RESPONSE
     * ========================================================
     */

    return res.status(500).json({
      success: false,

      message:
        error?.message ||
        "Transfer failed. No money was transferred.",
    });
  }
};

/*
 * ============================================================
 * GET SINGLE TRANSFER
 * ============================================================
 */

export const getTransferById = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const transfer =
      await Transfer.findOne({
        _id: req.params.id,

        $or: [
          {
            sender: userId,
          },
          {
            recipient: userId,
          },
        ],
      })
        .populate(
          "sender",
          "name email phone"
        )
        .populate(
          "recipient",
          "name email phone"
        )
        .populate(
          "fromAccount",
          "accountNumber accountType balance currency ifsc upiId"
        )
        .populate(
          "toAccount",
          "accountNumber accountType balance currency ifsc upiId"
        );

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: "Transfer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      transfer,
    });
  } catch (error) {
    console.error(
      "Get transfer error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch transfer.",
    });
  }
};