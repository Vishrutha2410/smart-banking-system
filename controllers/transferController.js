import Transfer from "../models/Transfer.js";
import Transaction from "../models/Transaction.js";
import Account from "../models/Account.js";
import User from "../models/User.js";

/**
 * Generate transfer reference number
 */
const generateReferenceNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000);

  return `TRF${timestamp}${random}`;
};

/**
 * Generate transaction reference number
 */
const generateTransactionReference = () => {
  const timestamp = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000);

  return `TXN${timestamp}${random}`;
};

/**
 * Generate transaction ID
 */
const generateTransactionId = () => {
  const timestamp = Date.now();
  const random = Math.floor(100 + Math.random() * 900);

  return `T${timestamp}${random}`;
};

/**
 * Get logged-in user's transfers
 */
export const getTransfers = async (req, res) => {
  try {
    const userId = req.user.id;

    const transfers = await Transfer.find({
      $or: [
        { sender: userId },
        { recipient: userId },
      ],
    })
      .populate("sender", "name email")
      .populate("recipient", "name email")
      .populate(
        "fromAccount",
        "accountNumber accountType balance status upiId ifsc"
      )
      .populate(
        "toAccount",
        "accountNumber accountType balance status upiId ifsc"
      )
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      transfers,
    });
  } catch (error) {
    console.error("Get transfers error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch transfers.",
    });
  }
};

/**
 * Create transfer
 */
export const createTransfer = async (req, res) => {
  let sourceAccount = null;
  let destinationAccount = null;

  let sourceBalanceUpdated = false;
  let destinationBalanceUpdated = false;

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
      transactionPin,
    } = req.body;

    /* =====================================================
       BASIC VALIDATION
    ====================================================== */

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

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero.",
      });
    }

    const transferAmount = Number(amount);

    /* =====================================================
   TRANSACTION PIN VERIFICATION
====================================================== */

if (!transactionPin) {
  return res.status(400).json({
    success: false,
    message:
      "Transaction PIN is required.",
  });
}

if (!/^\d{4}$/.test(transactionPin)) {
  return res.status(400).json({
    success: false,
    message:
      "Transaction PIN must contain exactly 4 digits.",
  });
}

const transferUser =
  await User.findById(userId).select(
    "+transactionPin"
  );

if (!transferUser) {
  return res.status(404).json({
    success: false,
    message: "User not found.",
  });
}

if (!transferUser.pinSet) {
  return res.status(403).json({
    success: false,
    message:
      "Transaction PIN has not been set. Activate your card and create a transaction PIN first.",
  });
}

const pinValid =
  await transferUser.compareTransactionPin(
    transactionPin
  );

if (!pinValid) {
  return res.status(400).json({
    success: false,
    message:
      "Incorrect transaction PIN. Please enter all transfer details again.",
  });
}

    /* =====================================================
       SOURCE ACCOUNT
    ====================================================== */

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

    // Account status in Account.js is lowercase.
    if (
      String(sourceAccount.status).toLowerCase() !==
      "active"
    ) {
      return res.status(400).json({
        success: false,
        message: "Source account is not active.",
      });
    }

    if (
      Number(sourceAccount.balance) <
      transferAmount
    ) {
      return res.status(400).json({
        success: false,
        message: "Insufficient account balance.",
      });
    }

    /* =====================================================
       TYPE-SPECIFIC VALIDATION
    ====================================================== */

    let recipientUser = null;

    /*
     * =====================================================
     * UPI TRANSFER
     * =====================================================
     */

    if (transferType === "UPI") {
      const normalizedUpiId =
        recipientUpiId?.trim().toLowerCase();

      if (!normalizedUpiId) {
        return res.status(400).json({
          success: false,
          message: "Recipient UPI ID is required.",
        });
      }

      /*
       * IMPORTANT:
       * Find the destination account using UPI ID.
       */
      destinationAccount =
        await Account.findOne({
          upiId: normalizedUpiId,
        });

      if (!destinationAccount) {
        return res.status(404).json({
          success: false,
          message:
            "Recipient UPI ID was not found.",
        });
      }

      /*
       * Destination account must also be active.
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
       * Prevent sending money to the same account.
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
       * Find recipient user.
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
    }

    /*
     * =====================================================
     * IMPS / NEFT / RTGS
     * =====================================================
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
          message: "Recipient name is required.",
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
       * Check whether the recipient account exists
       * inside SmartBank.
       *
       * If it exists, this will be an internal transfer
       * and the destination account will be credited.
       */
      destinationAccount =
        await Account.findOne({
          accountNumber:
            recipientAccountNumber.trim(),
        });

      if (destinationAccount) {
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
      }
    }

    /*
     * =====================================================
     * SELF TRANSFER
     * =====================================================
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
    }

    /* =====================================================
       IMPORTANT SAFETY CHECK
    ====================================================== */

    /*
     * UPI and SELF transfers MUST have a destination
     * account inside our system.
     *
     * Otherwise money could be debited without being
     * credited anywhere.
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

    /* =====================================================
       GENERATE REFERENCE
    ====================================================== */

    const referenceNumber =
      generateReferenceNumber();

    /* =====================================================
       UPDATE BALANCES
    ====================================================== */

    /*
     * Debit source account.
     */
    sourceAccount.balance =
      Number(sourceAccount.balance) -
      transferAmount;

    await sourceAccount.save();

    sourceBalanceUpdated = true;

    /*
     * Credit destination account when it belongs
     * to SmartBank.
     */
    if (destinationAccount) {
      destinationAccount.balance =
        Number(destinationAccount.balance) +
        transferAmount;

      await destinationAccount.save();

      destinationBalanceUpdated = true;
    }

    /* =====================================================
       CREATE TRANSFER RECORD
    ====================================================== */

    const transfer =
      await Transfer.create({
        sender: userId,

        recipient:
          recipientUser?._id ||
          undefined,

        fromAccount:
          sourceAccount._id,

        toAccount:
          destinationAccount?._id ||
          undefined,

        transferType,

        recipientName:
          recipientName?.trim() ||
          recipientUser?.name ||
          "",

        recipientAccountNumber:
          recipientAccountNumber?.trim() ||
          destinationAccount?.accountNumber ||
          "",

        recipientIfsc:
          recipientIfsc
            ?.trim()
            .toUpperCase() ||
          destinationAccount?.ifsc ||
          "",

        recipientUpiId:
          recipientUpiId
            ?.trim()
            .toLowerCase() ||
          destinationAccount?.upiId ||
          "",

        amount: transferAmount,

        description:
          description?.trim() || "",

        referenceNumber,

        status: "Completed",
      });

    /* =====================================================
       CREATE SENDER TRANSACTION
    ====================================================== */

    const senderTransaction =
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

        senderBank:
          sourceAccount.bank ||
          null,

        receiverBank:
          destinationAccount?.bank ||
          null,

        type: "expense",

        category:
          transferType === "UPI"
            ? "UPI Transfer"
            : "Bank Transfer",

        amount: transferAmount,

        transferMethod:
          transferType === "SELF"
            ? "OWN_ACCOUNT"
            : transferType,

        description:
          description?.trim() ||
          `Transfer via ${transferType}`,

        status: "SUCCESS",

        referenceNumber:
          generateTransactionReference(),

        date: new Date(),
      });

    /* =====================================================
       CREATE RECEIVER TRANSACTION
    ====================================================== */

    let receiverTransaction = null;

    if (
      destinationAccount &&
      recipientUser
    ) {
      receiverTransaction =
        await Transaction.create({
          transactionId:
            generateTransactionId(),

          user: recipientUser._id,

          account:
            destinationAccount._id,

          senderAccount:
            sourceAccount._id,

          receiverAccount:
            destinationAccount._id,

          senderBank:
            sourceAccount.bank ||
            null,

          receiverBank:
            destinationAccount.bank ||
            null,

          type: "income",

          category:
            transferType === "UPI"
              ? "UPI Received"
              : transferType === "SELF"
              ? "Own Account Transfer"
              : "Bank Transfer Received",

          amount: transferAmount,

          transferMethod:
            transferType === "SELF"
              ? "OWN_ACCOUNT"
              : transferType,

          description:
            description?.trim() ||
            `Received via ${transferType}`,

          status: "SUCCESS",

          referenceNumber:
            generateTransactionReference(),

          date: new Date(),
        });
    }

    /* =====================================================
       RESPONSE
    ====================================================== */

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
          "accountNumber accountType balance status upiId ifsc"
        )
        .populate(
          "toAccount",
          "accountNumber accountType balance status upiId ifsc"
        );

    res.status(201).json({
      success: true,

      message:
        `${transferType} transfer completed successfully.`,

      transfer:
        populatedTransfer,

      transaction:
        senderTransaction,

      receiverTransaction:
        receiverTransaction,
    });
  } catch (error) {
    console.error(
      "Create transfer error:",
      error
    );

    /*
     * =====================================================
     * BASIC ROLLBACK
     *
     * Because the project is using normal MongoDB
     * operations instead of MongoDB sessions/transactions,
     * attempt to restore balances if something failed
     * after the balance update.
     * =====================================================
     */

    try {
      if (
        sourceBalanceUpdated &&
        sourceAccount
      ) {
        sourceAccount.balance =
          Number(sourceAccount.balance) +
          Number(req.body.amount);

        await sourceAccount.save();
      }

      if (
        destinationBalanceUpdated &&
        destinationAccount
      ) {
        destinationAccount.balance =
          Number(destinationAccount.balance) -
          Number(req.body.amount);

        await destinationAccount.save();
      }
    } catch (rollbackError) {
      console.error(
        "Transfer rollback error:",
        rollbackError
      );
    }

    res.status(500).json({
      success: false,

      message:
        "Transfer failed. No money should remain debited.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
};

/**
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
          { sender: userId },
          { recipient: userId },
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
          "accountNumber accountType balance status upiId ifsc"
        )
        .populate(
          "toAccount",
          "accountNumber accountType balance status upiId ifsc"
        );

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: "Transfer not found.",
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