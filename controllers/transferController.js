import mongoose from "mongoose";

import Transfer from "../models/Transfer.js";
import Account from "../models/Account.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";


/*
 * Generate transfer reference number
 */
const generateReferenceNumber = () => {
  const timestamp = Date.now();

  const random = Math.floor(
    1000 + Math.random() * 9000
  );

  return `TRF${timestamp}${random}`;
};


/*
 * Generate transaction reference.
 *
 * We use a different reference from
 * the Transfer document.
 */
const generateTransactionReference = () => {
  const timestamp = Date.now();

  const random = Math.floor(
    1000 + Math.random() * 9000
  );

  return `TXN${timestamp}${random}`;
};


/*
 * Get logged-in user's transfers
 */
export const getTransfers = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const transfers =
      await Transfer.find({
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
          "name email"
        )
        .populate(
          "recipient",
          "name email"
        )
        .populate(
          "fromAccount",
          "accountNumber accountType balance"
        )
        .populate(
          "toAccount",
          "accountNumber accountType balance"
        )
        .sort({
          createdAt: -1,
        });

    res.status(200).json({
      success: true,
      transfers,
    });
  } catch (error) {
    console.error(
      "Get transfers error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch transfers.",
    });
  }
};


/*
 * Create transfer
 */
export const createTransfer = async (
  req,
  res
) => {
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
     * BASIC VALIDATION
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
        message:
          "Invalid transfer type.",
      });
    }


    if (!fromAccountId) {
      return res.status(400).json({
        success: false,
        message:
          "Source account is required.",
      });
    }


    if (
      !amount ||
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Amount must be greater than zero.",
      });
    }


    /*
     * SOURCE ACCOUNT
     */

    const sourceAccount =
      await Account.findOne({
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


    if (
      sourceAccount.status !==
      "active"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Source account is not active.",
      });
    }


    const transferAmount =
      Number(amount);


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
     * TYPE-SPECIFIC VALIDATION
     */

    let recipientUser = null;

    let destinationAccount = null;


    /*
     * UPI
     */
    if (
      transferType === "UPI"
    ) {
      if (
        !recipientUpiId ||
        !recipientUpiId.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Recipient UPI ID is required.",
        });
      }
    }


    /*
     * IMPS / NEFT / RTGS
     */
    if (
      transferType === "IMPS" ||
      transferType === "NEFT" ||
      transferType === "RTGS"
    ) {
      if (
        !recipientName ||
        !recipientName.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Recipient name is required.",
        });
      }


      if (
        !recipientAccountNumber ||
        !recipientAccountNumber.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Recipient account number is required.",
        });
      }


      if (
        !recipientIfsc ||
        !recipientIfsc.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Recipient IFSC code is required.",
        });
      }


      /*
       * Try to find the recipient
       * inside our simulated banking
       * system.
       */
      destinationAccount =
        await Account.findOne({
          accountNumber:
            recipientAccountNumber.trim(),
        });


      if (destinationAccount) {
        recipientUser =
          await User.findById(
            destinationAccount.user
          );
      }
    }


    /*
     * SELF TRANSFER
     */
    if (
      transferType === "SELF"
    ) {
      if (!toAccountId) {
        return res.status(400).json({
          success: false,
          message:
            "Destination account is required.",
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


      recipientUser =
        await User.findById(
          userId
        );
    }


    /*
     * UPDATE BALANCES
     */

    sourceAccount.balance =
      Number(sourceAccount.balance) -
      transferAmount;

    await sourceAccount.save();


    /*
     * Credit destination account
     * when it exists in our system.
     */
    if (
      destinationAccount
    ) {
      destinationAccount.balance =
        Number(
          destinationAccount.balance
        ) + transferAmount;

      await destinationAccount.save();
    }


    /*
     * CREATE TRANSFER RECORD
     */

    const transfer =
      await Transfer.create({
        sender: userId,

        recipient:
          recipientUser?._id ||
          undefined,

        fromAccount:
          fromAccountId,

        toAccount:
          destinationAccount?._id ||
          undefined,

        transferType,

        recipientName:
          recipientName?.trim() ||
          "",

        recipientAccountNumber:
          recipientAccountNumber
            ?.trim() ||
          "",

        recipientIfsc:
          recipientIfsc
            ?.trim()
            .toUpperCase() ||
          "",

        recipientUpiId:
          recipientUpiId
            ?.trim()
            .toLowerCase() ||
          "",

        amount:
          transferAmount,

        description:
          description?.trim() ||
          "",

        referenceNumber:
          generateReferenceNumber(),

        status: "Completed",
      });


    /*
     * =====================================================
     * CREATE TRANSACTION RECORDS
     * =====================================================
     *
     * This is the important part.
     *
     * Fund transfers are NOT expenses.
     *
     * Therefore:
     *
     * Sender:
     *   type = expense
     *   transactionKind = TRANSFER
     *
     * Receiver:
     *   type = income
     *   transactionKind = TRANSFER
     *
     * Budget will ignore both because
     * it only counts transactionKind = EXPENSE.
     */


    /*
     * Sender transaction
     */
    await Transaction.create({
      transactionId:
        Transaction.generateTransactionId
          ? Transaction.generateTransactionId()
          : `T${Date.now()}${Math.floor(
              Math.random() * 1000
            )}`,

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
        description?.trim() ||
        `${transferType} transfer`,

      status:
        "SUCCESS",

      referenceNumber:
        generateTransactionReference(),

      date:
        new Date(),
    });


    /*
     * Receiver transaction
     *
     * Only create this when the
     * destination account belongs
     * to our simulated banking system.
     */
    if (
      destinationAccount
    ) {
      await Transaction.create({
        transactionId:
          Transaction.generateTransactionId
            ? Transaction.generateTransactionId()
            : `T${Date.now()}${Math.floor(
                Math.random() * 1000
              )}`,

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
          description?.trim() ||
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
     * RESPONSE
     */

    const populatedTransfer =
      await Transfer.findById(
        transfer._id
      )
        .populate(
          "sender",
          "name email"
        )
        .populate(
          "recipient",
          "name email"
        )
        .populate(
          "fromAccount",
          "accountNumber accountType balance"
        )
        .populate(
          "toAccount",
          "accountNumber accountType balance"
        );


    res.status(201).json({
      success: true,

      message:
        `${transferType} transfer completed successfully.`,

      transfer:
        populatedTransfer,
    });
  } catch (error) {
    console.error(
      "Create transfer error:",
      error
    );

    res.status(500).json({
      success: false,

      message:
        "Transfer failed.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
};


/*
 * Get single transfer
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
          "name email"
        )
        .populate(
          "recipient",
          "name email"
        )
        .populate(
          "fromAccount",
          "accountNumber accountType balance"
        )
        .populate(
          "toAccount",
          "accountNumber accountType balance"
        );


    if (!transfer) {
      return res.status(404).json({
        success: false,
        message:
          "Transfer not found.",
      });
    }


    res.status(200).json({
      success: true,
      transfer,
    });
  } catch (error) {
    console.error(
      "Get transfer error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch transfer.",
    });
  }
};