import mongoose from "mongoose";

import Transfer from "../models/Transfer.js";
import Account from "../models/Account.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

/*
 * ============================================================
 * REFERENCE NUMBER HELPERS
 * ============================================================
 */

const generateReferenceNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(
    1000 + Math.random() * 9000
  );

  return `TRF${timestamp}${random}`;
};

const generateTransactionReference = () => {
  const timestamp = Date.now();
  const random = Math.floor(
    1000 + Math.random() * 9000
  );

  return `TXN${timestamp}${random}`;
};

const generateTransactionId = () => {
  if (
    typeof Transaction.generateTransactionId ===
    "function"
  ) {
    return Transaction.generateTransactionId();
  }

  return `T${Date.now()}${Math.floor(
    Math.random() * 1000
  )}`;
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
 * For UPI transfers inside this Smart Banking System:
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
 * This means the transfer appears correctly for both users
 * and in the Admin Dashboard.
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
      !allowedTransferTypes.includes(
        transferType
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid transfer type.",
      });
    }

    if (!fromAccountId) {
      return res.status(400).json({
        success: false,
        message:
          "Source account is required.",
      });
    }

    const transferAmount = Number(amount);

    if (
      !Number.isFinite(transferAmount) ||
      transferAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Amount must be greater than zero.",
      });
    }

    /*
     * ========================================================
     * VALIDATE SOURCE ACCOUNT ID
     * ========================================================
     */

    if (
      !mongoose.isValidObjectId(
        fromAccountId
      )
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
        message:
          "Source account not found.",
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
        message:
          "Source account is not active.",
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
        message:
          "Insufficient account balance.",
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
     * THIS IS THE IMPORTANT FIX.
     *
     * Previously your code only checked whether the UPI ID
     * was entered.
     *
     * It did NOT find the friend's Account document.
     *
     * Now we:
     *
     * 1. Normalize the UPI ID.
     * 2. Find the friend's Account using upiId.
     * 3. Get the friend's User.
     * 4. Make sure the receiver is active.
     * 5. Make sure sender and receiver are different.
     */

    if (transferType === "UPI") {
      const normalizedUpiId =
        String(recipientUpiId || "")
          .trim()
          .toLowerCase();

      if (!normalizedUpiId) {
        return res.status(400).json({
          success: false,
          message:
            "Recipient UPI ID is required.",
        });
      }

      /*
       * FIND FRIEND'S ACCOUNT BY UPI ID
       *
       * Account.upiId is stored in lowercase by the schema.
       */

      destinationAccount =
        await Account.findOne({
          upiId: normalizedUpiId,
        });

      /*
       * IMPORTANT:
       *
       * Never debit the sender if the UPI ID
       * doesn't belong to an account in our system.
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

      recipientUser =
        await User.findById(
          destinationAccount.user
        );

      if (!recipientUser) {
        return res.status(404).json({
          success: false,
          message:
            "Recipient user was not found.",
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
     * send money to an external banking network.
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
          message:
            "Recipient name is required.",
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
       * Try to find the recipient in our own
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
         * Don't allow the same account.
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
          );

        if (!recipientUser) {
          return res.status(404).json({
            success: false,
            message:
              "Recipient user was not found.",
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

      recipientUser =
        await User.findById(userId);

      if (!recipientUser) {
        return res.status(404).json({
          success: false,
          message:
            "User account was not found.",
        });
      }
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
     * We keep these values so that if something fails later,
     * we can restore the balances.
     *
     * This avoids the previous situation where the sender
     * could lose money even if the rest of the transfer
     * failed.
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
     * For UPI, always take the receiver's actual
     * information from the destination Account/User.
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
         * THIS IS THE OTHER IMPORTANT FIX.
         *
         * recipient now contains the actual User ID
         * of the friend's account.
         */

        recipient:
          recipientUser?._id || undefined,

        fromAccount:
          sourceAccount._id,

        /*
         * THIS stores the actual destination Account.
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
     * This is what makes the transfer appear in the
     * friend's transaction history.
     */

    if (destinationAccount && recipientUser) {
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
     * restore the balances and remove any partially-created
     * documents.
     *
     * This works without requiring a MongoDB replica-set
     * transaction.
     */

    try {
      if (
        createdReceiverTransaction?._id
      ) {
        await Transaction.deleteOne({
          _id:
            createdReceiverTransaction._id,
        });
      }

      if (
        createdSenderTransaction?._id
      ) {
        await Transaction.deleteOne({
          _id:
            createdSenderTransaction._id,
        });
      }

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
            _id: sourceAccount._id,
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
        originalDestinationBalance !==
          null
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