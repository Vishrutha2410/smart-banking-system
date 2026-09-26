import { useEffect, useMemo, useState } from "react";

import {
  FiPlus,
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiUser,
  FiCreditCard,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiX,
  FiShield,
  FiChevronRight,
} from "react-icons/fi";

import {
  getAccounts,
  getBanks,
  createAccount,
  setAccountStatus,
  creditAccount,
  debitAccount,
} from "../services/accountService";

import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";


/* =========================================================
   CONSTANTS
========================================================= */

const ACCOUNT_TYPES = [
  "Savings",
  "Current",
  "Salary",
];

const RELATIONSHIPS = [
  "Father",
  "Mother",
  "Spouse",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Other",
];


/* =========================================================
   BANK HELPERS
========================================================= */

const getBankName = (bank) => {
  if (!bank) return "";

  return (
    bank.bankName ||
    bank.name ||
    ""
  );
};

const getBankShortName = (bank) => {
  if (!bank) return "";

  return (
    bank.shortName ||
    ""
  );
};

const getBankId = (bank) => {
  if (!bank) return "";

  return (
    bank.bankId ||
    ""
  );
};


/* =========================================================
   BANK STYLE
========================================================= */

const getBankStyle = (shortName = "") => {
  const name =
    String(shortName).toUpperCase();

  if (name === "SBI") {
    return {
      icon: "SBI",
      iconBox:
        "bg-blue-600 text-white",
      text:
        "text-blue-700",
      background:
        "bg-blue-50",
    };
  }

  if (name === "HDFC") {
    return {
      icon: "HDFC",
      iconBox:
        "bg-red-600 text-white",
      text:
        "text-red-700",
      background:
        "bg-red-50",
    };
  }

  if (name === "ICICI") {
    return {
      icon: "ICICI",
      iconBox:
        "bg-orange-500 text-white",
      text:
        "text-orange-700",
      background:
        "bg-orange-50",
    };
  }

  if (name === "AXIS") {
    return {
      icon: "AXIS",
      iconBox:
        "bg-purple-600 text-white",
      text:
        "text-purple-700",
      background:
        "bg-purple-50",
    };
  }

  return {
    icon: "SMB",
    iconBox:
      "bg-emerald-600 text-white",
    text:
      "text-emerald-700",
    background:
      "bg-emerald-50",
  };
};


/* =========================================================
   COPY BUTTON
========================================================= */

const CopyButton = ({
  value,
}) => {
  const [copied, setCopied] =
    useState(false);

  if (!value) return null;

  const handleCopy =
    async () => {
      try {
        await navigator.clipboard.writeText(
          String(value)
        );

        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 1500);
      } catch (error) {
        console.error(
          "Copy failed:",
          error
        );
      }
    };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-1 inline-flex items-center rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      title="Copy"
    >
      {copied ? (
        <FiCheckCircle className="text-emerald-600" />
      ) : (
        <FiCopy />
      )}
    </button>
  );
};


/* =========================================================
   MESSAGE MODAL
========================================================= */

const MessageModal = ({
  type,
  title,
  message,
  onClose,
}) => {
  const isSuccess =
    type === "success";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">

      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">

        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
            isSuccess
              ? "bg-emerald-100 text-emerald-600"
              : "bg-red-100 text-red-600"
          }`}
        >
          {isSuccess ? (
            <FiCheckCircle size={28} />
          ) : (
            <FiX size={28} />
          )}
        </div>

        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          {title}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {message}
        </p>

        <button
          type="button"
          onClick={onClose}
          className={`mt-5 w-full rounded-lg py-2.5 text-sm font-medium text-white ${
            isSuccess
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          OK
        </button>

      </div>
    </div>
  );
};


/* =========================================================
   MONEY MODAL
========================================================= */

const MoneyModal = ({
  mode,
  account,
  onClose,
  onSuccess,
}) => {
  const [amount, setAmount] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [error, setError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const isCredit =
    mode === "credit";

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      setError("");

      const numericAmount =
        Number(amount);

      if (
        !numericAmount ||
        numericAmount <= 0
      ) {
        setError(
          "Please enter an amount greater than zero."
        );

        return;
      }

      setSubmitting(true);

      try {
        const result =
          isCredit
            ? await creditAccount(
                account._id,
                numericAmount,
                description
              )
            : await debitAccount(
                account._id,
                numericAmount,
                description
              );

        onSuccess(
          result.account
        );
      } catch (err) {
        setError(
          err.message ||
            `Could not ${
              isCredit
                ? "credit"
                : "debit"
            } the account.`
        );
      } finally {
        setSubmitting(false);
      }
    };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">

      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">

        <div className="flex items-start justify-between">

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isCredit
                ? "Credit Money"
                : "Debit Money"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Account ••••{" "}
              {String(
                account.accountNumber ||
                  ""
              ).slice(-4)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <FiX />
          </button>

        </div>


        <div className="mt-3 rounded-lg bg-slate-50 p-3">

          <p className="text-xs text-slate-500">
            Current Balance
          </p>

          <p className="mt-1 text-lg font-semibold text-slate-900">
            ₹
            {Number(
              account.balance || 0
            ).toLocaleString(
              "en-IN"
            )}
          </p>

        </div>


        {error && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}


        <form
          onSubmit={handleSubmit}
          className="mt-5 space-y-4"
        >

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Amount
            </label>

            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) =>
                setAmount(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              placeholder="0.00"
              autoFocus
            />
          </div>


          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Description
              <span className="font-normal text-slate-400">
                {" "}
                (optional)
              </span>
            </label>

            <input
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              placeholder={
                isCredit
                  ? "e.g. Salary deposit"
                  : "e.g. Grocery shopping"
              }
            />
          </div>


          <div className="flex gap-3 pt-2">

            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-60 ${
                isCredit
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {submitting
                ? isCredit
                  ? "Crediting..."
                  : "Debiting..."
                : isCredit
                ? "Credit Money"
                : "Debit Money"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
};


/* =========================================================
   ACCOUNTS PAGE
========================================================= */

const Accounts = () => {
  const { user } =
    useAuth();

  const {
    refresh:
      refreshNotifications,
  } = useNotifications();

  const [accounts, setAccounts] =
    useState([]);

  const [banks, setBanks] =
    useState([]);

  const [status, setStatus] =
    useState("loading");

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [moneyModal, setMoneyModal] =
    useState(null);

  const [messageModal, setMessageModal] =
    useState(null);

  const [creating, setCreating] =
    useState(false);

  const [formError, setFormError] =
    useState("");


  /* =======================================================
     FORM
  ======================================================= */

  const [form, setForm] =
    useState({
      bankId: "",
      accountType: "Savings",

      fullName: "",
      email: "",
      mobileNumber: "",
      dateOfBirth: "",
      gender: "",

      address: "",
      city: "",
      state: "",
      pincode: "",

      panNumber: "",
      aadhaarNumber: "",

      nomineeName: "",
      nomineeRelationship: "",
      nomineePhone: "",

      initialDeposit: "",

      transactionPin: "",
    });


  /* =======================================================
     USED BANK IDS
  ======================================================= */

  const usedBankIds =
    useMemo(() => {
      const ids = new Set();

      accounts.forEach(
        (account) => {
          if (!account.bank) {
            return;
          }

          if (
            typeof account.bank ===
            "object"
          ) {
            if (
              account.bank._id
            ) {
              ids.add(
                String(
                  account.bank._id
                )
              );
            }

            if (
              account.bank.bankId
            ) {
              ids.add(
                String(
                  account.bank.bankId
                )
              );
            }

            return;
          }

          ids.add(
            String(
              account.bank
            )
          );
        }
      );

      return ids;
    }, [accounts]);


  /* =======================================================
     AVAILABLE BANKS
  ======================================================= */

  const availableBanks =
    useMemo(() => {
      return banks.filter(
        (bank) => {
          const mongoId =
            String(
              bank._id || ""
            );

          const projectBankId =
            String(
              bank.bankId || ""
            );

          return (
            !usedBankIds.has(
              mongoId
            ) &&
            !usedBankIds.has(
              projectBankId
            )
          );
        }
      );
    }, [
      banks,
      usedBankIds,
    ]);


  /* =======================================================
     LOAD
  ======================================================= */

  const load = async () => {
    setStatus("loading");

    try {
      const [
        accountData,
        bankData,
      ] = await Promise.all([
        getAccounts(),
        getBanks(),
      ]);

      const loadedAccounts =
        Array.isArray(
          accountData
        )
          ? accountData
          : [];

      const loadedBanks =
        Array.isArray(
          bankData
        )
          ? bankData
          : [];

      setAccounts(
        loadedAccounts
      );

      setBanks(
        loadedBanks
      );

      const usedIds =
        new Set();

      loadedAccounts.forEach(
        (account) => {
          if (!account.bank) {
            return;
          }

          if (
            typeof account.bank ===
            "object"
          ) {
            if (
              account.bank._id
            ) {
              usedIds.add(
                String(
                  account.bank._id
                )
              );
            }

            if (
              account.bank.bankId
            ) {
              usedIds.add(
                String(
                  account.bank.bankId
                )
              );
            }
          } else {
            usedIds.add(
              String(
                account.bank
              )
            );
          }
        }
      );

      const firstAvailable =
        loadedBanks.find(
          (bank) =>
            !usedIds.has(
              String(
                bank._id
              )
            ) &&
            !usedIds.has(
              String(
                bank.bankId
              )
            )
        );

      setForm(
        (previous) => ({
          ...previous,
          bankId:
            firstAvailable?._id ||
            firstAvailable?.bankId ||
            previous.bankId ||
            "",
        })
      );

      setStatus("success");
    } catch (error) {
      console.error(
        "[Accounts] Failed to load:",
        error
      );

      setStatus("error");
    }
  };


  useEffect(() => {
    load();
  }, []);


  /* =======================================================
     PREFILL USER DETAILS
  ======================================================= */

  useEffect(() => {
    if (!user) return;

    setForm(
      (previous) => ({
        ...previous,

        fullName:
          previous.fullName ||
          user.name ||
          "",

        email:
          previous.email ||
          user.email ||
          "",

        mobileNumber:
          previous.mobileNumber ||
          user.phone ||
          user.mobileNumber ||
          "",

        address:
          previous.address ||
          user.address ||
          "",
      })
    );
  }, [user]);


  /* =======================================================
     UPDATE FORM
  ======================================================= */

  const updateForm = (
    field,
    value
  ) => {
    setForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  };


  /* =======================================================
     OPEN CREATE ACCOUNT
  ======================================================= */

  const openCreateModal = (
    selectedBankId = ""
  ) => {
    setFormError("");

    const bankToUse =
      selectedBankId ||
      availableBanks[0]?._id ||
      availableBanks[0]?.bankId ||
      "";

    setForm(
      (previous) => ({
        ...previous,

        bankId: bankToUse,

        fullName:
          user?.name ||
          previous.fullName ||
          "",

        email:
          user?.email ||
          previous.email ||
          "",

        mobileNumber:
          user?.phone ||
          user?.mobileNumber ||
          previous.mobileNumber ||
          "",

        address:
          user?.address ||
          previous.address ||
          "",

        transactionPin: "",
      })
    );

    setShowCreateModal(
      true
    );
  };


  /* =======================================================
     CLOSE CREATE MODAL
  ======================================================= */

  const closeCreateModal = () => {
    if (creating) return;

    setShowCreateModal(
      false
    );

    setFormError("");
  };


  /* =======================================================
     CREATE ACCOUNT
  ======================================================= */

  const handleCreate =
    async (e) => {
      e.preventDefault();

      setFormError("");

      if (!form.bankId) {
        setFormError(
          "Please select a bank."
        );

        return;
      }

      const selectedBank =
        banks.find(
          (bank) =>
            String(
              bank._id
            ) ===
              String(
                form.bankId
              ) ||
            String(
              bank.bankId
            ) ===
              String(
                form.bankId
              )
        );

      if (!selectedBank) {
        setFormError(
          "Please select a valid bank."
        );

        return;
      }

      const selectedMongoId =
        String(
          selectedBank._id ||
            ""
        );

      const selectedProjectId =
        String(
          selectedBank.bankId ||
            ""
        );

      if (
        usedBankIds.has(
          selectedMongoId
        ) ||
        usedBankIds.has(
          selectedProjectId
        )
      ) {
        setFormError(
          `You already have an account with ${getBankName(
            selectedBank
          )}. Please select another bank.`
        );

        return;
      }

      if (
        !form.fullName.trim()
      ) {
        setFormError(
          "Full name is required."
        );

        return;
      }

      if (
        !form.email.trim()
      ) {
        setFormError(
          "Email is required."
        );

        return;
      }

      if (
        form.mobileNumber &&
        !/^[6-9]\d{9}$/.test(
          form.mobileNumber.trim()
        )
      ) {
        setFormError(
          "Please enter a valid 10-digit mobile number."
        );

        return;
      }

      if (
        form.pincode &&
        !/^\d{6}$/.test(
          form.pincode.trim()
        )
      ) {
        setFormError(
          "Pincode must contain 6 digits."
        );

        return;
      }

      if (
        form.panNumber &&
        !/^[A-Za-z]{5}\d{4}[A-Za-z]$/.test(
          form.panNumber.trim()
        )
      ) {
        setFormError(
          "Please enter a valid PAN number."
        );

        return;
      }

      if (
        form.aadhaarNumber &&
        !/^\d{12}$/.test(
          form.aadhaarNumber.trim()
        )
      ) {
        setFormError(
          "Aadhaar number must contain 12 digits."
        );

        return;
      }

      if (
        form.nomineeName &&
        !form.nomineeRelationship
      ) {
        setFormError(
          "Please select nominee relationship."
        );

        return;
      }

      if (
        form.nomineePhone &&
        !/^[6-9]\d{9}$/.test(
          form.nomineePhone.trim()
        )
      ) {
        setFormError(
          "Please enter a valid nominee mobile number."
        );

        return;
      }

      if (
        !/^\d{4}$/.test(
          form.transactionPin
        )
      ) {
        setFormError(
          "Transaction PIN must contain exactly 4 digits."
        );

        return;
      }

      const deposit =
        Number(
          form.initialDeposit
        ) || 0;

      if (
        !Number.isFinite(
          deposit
        ) ||
        deposit < 0
      ) {
        setFormError(
          "Initial deposit cannot be negative."
        );

        return;
      }

      setCreating(true);

      try {
        const accountData = {
          bankId:
            form.bankId,

          accountType:
            form.accountType,

          fullName:
            form.fullName.trim(),

          email:
            form.email.trim(),

          mobileNumber:
            form.mobileNumber.trim(),

          dateOfBirth:
            form.dateOfBirth ||
            null,

          gender:
            form.gender,

          address:
            form.address.trim(),

          city:
            form.city.trim(),

          state:
            form.state.trim(),

          pincode:
            form.pincode.trim(),

          panNumber:
            form.panNumber
              .trim()
              .toUpperCase(),

          aadhaarNumber:
            form.aadhaarNumber.trim(),

          nomineeName:
            form.nomineeName.trim(),

          nomineeRelationship:
            form.nomineeRelationship,

          nomineePhone:
            form.nomineePhone.trim(),

          initialDeposit:
            deposit,

          /*
            No description while
            creating account.
          */
          transactionPin:
            form.transactionPin,
        };

        await createAccount(
          accountData
        );

        setShowCreateModal(
          false
        );

        await load();

        try {
          await refreshNotifications();
        } catch {
          // Ignore notification errors.
        }

        setForm({
          bankId: "",
          accountType: "Savings",

          fullName:
            user?.name || "",

          email:
            user?.email || "",

          mobileNumber:
            user?.phone ||
            user?.mobileNumber ||
            "",

          dateOfBirth: "",
          gender: "",

          address:
            user?.address || "",

          city: "",
          state: "",
          pincode: "",

          panNumber: "",
          aadhaarNumber: "",

          nomineeName: "",
          nomineeRelationship: "",
          nomineePhone: "",

          initialDeposit: "",

          transactionPin: "",
        });

        setMessageModal({
          type: "success",
          title:
            "Account Created Successfully",
          message: `Your ${
            selectedBank.bankName ||
            selectedBank.name
          } account has been created successfully.`,
        });
      } catch (error) {
        console.error(
          "[Accounts] Create account failed:",
          error
        );

        setFormError(
          error.message ||
            "Could not create account."
        );
      } finally {
        setCreating(false);
      }
    };


  /* =======================================================
     STATUS
  ======================================================= */

  const toggleStatus =
    async (account) => {
      const newStatus =
        account.status ===
        "active"
          ? "inactive"
          : "active";

      try {
        const updated =
          await setAccountStatus(
            account._id,
            newStatus
          );

        setAccounts(
          (previous) =>
            previous.map(
              (item) =>
                item._id ===
                updated._id
                  ? updated
                  : item
            )
        );

        try {
          await refreshNotifications();
        } catch {
          // Ignore notification errors.
        }
      } catch (error) {
        setMessageModal({
          type: "error",
          title:
            "Status Update Failed",
          message:
            error.message ||
            "Could not update account status.",
        });
      }
    };


  /* =======================================================
     MONEY SUCCESS
  ======================================================= */

  const handleMoneySuccess =
    async (
      updatedAccount
    ) => {
      setAccounts(
        (previous) =>
          previous.map(
            (item) =>
              item._id ===
              updatedAccount._id
                ? {
                    ...item,
                    ...updatedAccount,
                  }
                : item
          )
      );

      setMoneyModal(null);

      try {
        await refreshNotifications();
      } catch {
        // Ignore notification errors.
      }

      setMessageModal({
        type: "success",
        title:
          "Transaction Successful",
        message:
          "Your account balance has been updated successfully.",
      });
    };


  /* =======================================================
     LOADING
  ======================================================= */

  if (
    status === "loading"
  ) {
    return (
      <Loader
        label="Loading accounts..."
      />
    );
  }


  /* =======================================================
     ERROR
  ======================================================= */

  if (
    status === "error"
  ) {
    return (
      <ErrorState
        onRetry={load}
      />
    );
  }


  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="space-y-7">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Accounts
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your bank accounts and balances.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            openCreateModal()
          }
          disabled={
            banks.length > 0 &&
            availableBanks.length ===
              0
          }
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiPlus />

          {banks.length > 0 &&
          availableBanks.length ===
            0
            ? "All Banks Used"
            : "New Account"}
        </button>

      </div>


      {/* =====================================================
          EXISTING ACCOUNTS
      ===================================================== */}

      {accounts.length ===
      0 ? (
        <EmptyState
          title="No accounts found"
          message="Create your first bank account using one of the available banks below."
        />
      ) : (
        <section>

          <div className="mb-4 flex items-center justify-between">

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Your Accounts
              </h2>

              <p className="text-sm text-slate-500">
                Your existing bank accounts.
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {accounts.length}{" "}
              {accounts.length ===
              1
                ? "Account"
                : "Accounts"}
            </span>

          </div>


          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

            {accounts.map(
              (account) => {
                const bank =
                  account.bank &&
                  typeof account.bank ===
                    "object"
                    ? account.bank
                    : null;

                const bankName =
                  getBankName(
                    bank
                  ) ||
                  account.bankName ||
                  "Bank not assigned";

                const shortName =
                  getBankShortName(
                    bank
                  ) ||
                  account.bankShortName ||
                  "BANK";

                const bankId =
                  getBankId(
                    bank
                  ) || "";

                const bankStyle =
                  getBankStyle(
                    shortName
                  );

                return (
                  <div
                    key={
                      account._id
                    }
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >

                    {/* BANK HEADER */}

                    <div
                      className={`border-b px-5 py-4 ${bankStyle.background}`}
                    >

                      <div className="flex items-center justify-between">

                        <div className="flex items-center gap-3">

                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-xl text-[10px] font-bold ${bankStyle.iconBox}`}
                          >
                            {bankStyle.icon}
                          </div>

                          <div>

                            <p className="text-sm font-semibold text-slate-900">
                              {bankName}
                            </p>

                            <p
                              className={`text-xs font-medium ${bankStyle.text}`}
                            >
                              {shortName}
                            </p>

                          </div>

                        </div>


                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            account.status ===
                            "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {account.status}
                        </span>

                      </div>

                    </div>


                    {/* ACCOUNT BODY */}

                    <div className="p-5">

                      <div className="flex items-center justify-between">

                        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                          {
                            account.accountType
                          }
                        </span>

                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <FiClock />

                          {account.createdAt
                            ? new Date(
                                account.createdAt
                              ).toLocaleDateString(
                                "en-IN"
                              )
                            : "-"}
                        </div>

                      </div>


                      {/* ACCOUNT NUMBER */}

                      <div className="mt-5">

                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Account Number
                        </p>

                        <div className="mt-1 flex items-center">

                          <p className="font-mono text-base font-semibold tracking-wide text-slate-800">
                            {
                              account.accountNumber
                            }
                          </p>

                          <CopyButton
                            value={
                              account.accountNumber
                            }
                          />

                        </div>

                      </div>


                      {/* BALANCE */}

                      <div className="mt-4">

                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Available Balance
                        </p>

                        <p className="mt-1 text-2xl font-bold text-slate-900">
                          ₹
                          {Number(
                            account.balance ||
                              0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </p>

                      </div>


                      {/* BANK INFO */}

                      <div className="mt-4 grid grid-cols-2 gap-2">

                        <div className="rounded-lg bg-slate-50 p-2.5">

                          <p className="text-[10px] uppercase tracking-wide text-slate-400">
                            Bank ID
                          </p>

                          <p className="mt-1 truncate text-xs font-semibold text-slate-700">
                            {bankId ||
                              "—"}
                          </p>

                        </div>


                        <div className="rounded-lg bg-slate-50 p-2.5">

                          <p className="text-[10px] uppercase tracking-wide text-slate-400">
                            IFSC
                          </p>

                          <div className="flex items-center">

                            <p className="truncate text-xs font-semibold text-slate-700">
                              {account.ifsc ||
                                "—"}
                            </p>

                            {account.ifsc && (
                              <CopyButton
                                value={
                                  account.ifsc
                                }
                              />
                            )}

                          </div>

                        </div>

                      </div>


                      {/* UPI */}

                      {account.upiId && (
                        <div className="mt-2 rounded-lg bg-slate-50 p-2.5">

                          <p className="text-[10px] uppercase tracking-wide text-slate-400">
                            UPI ID
                          </p>

                          <div className="flex items-center">

                            <p className="truncate text-xs font-semibold text-slate-700">
                              {
                                account.upiId
                              }
                            </p>

                            <CopyButton
                              value={
                                account.upiId
                              }
                            />

                          </div>

                        </div>
                      )}


                      {/* CREDIT / DEBIT */}

                      <div className="mt-5 grid grid-cols-2 gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            setMoneyModal(
                              {
                                mode: "credit",
                                account,
                              }
                            )
                          }
                          disabled={
                            account.status !==
                            "active"
                          }
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FiArrowDownCircle />
                          Credit
                        </button>


                        <button
                          type="button"
                          onClick={() =>
                            setMoneyModal(
                              {
                                mode: "debit",
                                account,
                              }
                            )
                          }
                          disabled={
                            account.status !==
                            "active"
                          }
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FiArrowUpCircle />
                          Debit
                        </button>

                      </div>


                      {/* STATUS */}

                      <button
                        type="button"
                        onClick={() =>
                          toggleStatus(
                            account
                          )
                        }
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                      >
                        {account.status ===
                        "active"
                          ? "Deactivate Account"
                          : "Activate Account"}
                      </button>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </section>
      )}


      {/* =====================================================
          AVAILABLE ACCOUNTS

          ONE CONTAINER
          NO BANK ID
          NO IFSC
          NO SEPARATE CARDS
      ===================================================== */}

      <section className="pt-2">

        <div className="mb-4">

          <div className="flex items-center gap-2">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <FiCreditCard />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Available Accounts
              </h2>

              <p className="text-sm text-slate-500">
                Choose a bank to create another account.
              </p>
            </div>

          </div>

        </div>


        {/* ONE MAIN CONTAINER */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {availableBanks.length ===
          0 ? (

            <div className="p-8 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <FiCheckCircle size={22} />
              </div>

              <h3 className="mt-3 text-sm font-semibold text-slate-900">
                All Available Banks Used
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                You already have an account with every bank available in the Smart Banking System.
              </p>

            </div>

          ) : (

            <div>

              {availableBanks.map(
                (
                  bank,
                  index
                ) => {
                  const shortName =
                    getBankShortName(
                      bank
                    );

                  const bankStyle =
                    getBankStyle(
                      shortName
                    );

                  return (
                    <div
                      key={
                        bank._id ||
                        bank.bankId
                      }
                      className={`flex flex-col gap-4 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between ${
                        index !==
                        availableBanks.length -
                          1
                          ? "border-b border-slate-100"
                          : ""
                      }`}
                    >

                      {/* BANK DETAILS */}

                      <div className="flex items-center gap-4">

                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold ${bankStyle.iconBox}`}
                        >
                          {bankStyle.icon}
                        </div>


                        <div>

                          <p className="text-sm font-semibold text-slate-900">
                            {getBankName(
                              bank
                            )}
                          </p>

                          <p
                            className={`mt-0.5 text-xs font-medium ${bankStyle.text}`}
                          >
                            {shortName}
                          </p>

                        </div>

                      </div>


                      {/* CREATE BUTTON */}

                      <button
                        type="button"
                        onClick={() =>
                          openCreateModal(
                            bank._id ||
                              bank.bankId
                          )
                        }
                        className="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
                      >
                        <FiPlus />

                        Create Account

                        <FiChevronRight
                          size={15}
                        />
                      </button>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>

      </section>


      {/* =====================================================
          CREATE ACCOUNT MODAL
      ===================================================== */}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-6">

          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">

            {/* HEADER */}

            <div className="flex items-start justify-between border-b border-slate-100 p-6">

              <div className="flex items-center gap-3">

                {user?.profileImage ? (
                  <img
                    src={
                      user.profileImage
                    }
                    alt="Profile"
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <FiUser />
                  </div>
                )}

                <div>

                  <h2 className="text-xl font-semibold text-slate-900">
                    Create Bank Account
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Select a bank and enter your account details.
                  </p>

                </div>

              </div>


              <button
                type="button"
                onClick={
                  closeCreateModal
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <FiX size={20} />
              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={
                handleCreate
              }
              className="max-h-[75vh] space-y-6 overflow-y-auto p-6"
            >

              {formError && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600">
                  {formError}
                </div>
              )}


              {/* BANK */}

              <section>

                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Bank Selection
                </h3>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Select Bank
                  </label>

                  <select
                    value={
                      form.bankId
                    }
                    onChange={(e) =>
                      updateForm(
                        "bankId",
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  >

                    <option value="">
                      Select a bank
                    </option>

                    {banks.map(
                      (bank) => {
                        const alreadyUsed =
                          usedBankIds.has(
                            String(
                              bank._id
                            )
                          ) ||
                          usedBankIds.has(
                            String(
                              bank.bankId
                            )
                          );

                        return (
                          <option
                            key={
                              bank._id ||
                              bank.bankId
                            }
                            value={
                              bank._id ||
                              bank.bankId
                            }
                            disabled={
                              alreadyUsed
                            }
                          >
                            {getBankName(
                              bank
                            )}{" "}
                            (
                            {getBankShortName(
                              bank
                            )}
                            )
                            {alreadyUsed
                              ? " — Already have an account"
                              : ""}
                          </option>
                        );
                      }
                    )}

                  </select>


                  {/* SELECTED BANK */}

                  {form.bankId && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">

                      {(() => {
                        const selectedBank =
                          banks.find(
                            (bank) =>
                              String(
                                bank._id
                              ) ===
                                String(
                                  form.bankId
                                ) ||
                              String(
                                bank.bankId
                              ) ===
                                String(
                                  form.bankId
                                )
                          );

                        if (
                          !selectedBank
                        ) {
                          return null;
                        }

                        const style =
                          getBankStyle(
                            getBankShortName(
                              selectedBank
                            )
                          );

                        return (
                          <div className="flex items-center gap-3">

                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-lg text-[9px] font-bold ${style.iconBox}`}
                            >
                              {style.icon}
                            </div>

                            <div>

                              <p className="text-sm font-semibold text-slate-800">
                                {getBankName(
                                  selectedBank
                                )}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-500">
                                {
                                  getBankShortName(
                                    selectedBank
                                  )
                                }
                              </p>

                            </div>

                          </div>
                        );
                      })()}

                    </div>
                  )}

                  <p className="mt-2 text-xs text-slate-500">
                    You can create only one account with each bank.
                  </p>

                </div>

              </section>


              {/* PERSONAL DETAILS */}

              <section>

                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Personal Details
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Full Name
                    </label>

                    <input
                      value={
                        form.fullName
                      }
                      onChange={(e) =>
                        updateForm(
                          "fullName",
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                      placeholder="Your full name"
                    />
                  </div>


                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Email
                    </label>

                    <input
                      type="email"
                      value={
                        form.email
                      }
                      readOnly
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
                    />
                  </div>


                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Mobile Number
                    </label>

                    <input
                      type="tel"
                      maxLength="10"
                      value={
                        form.mobileNumber
                      }
                      onChange={(e) =>
                        updateForm(
                          "mobileNumber",
                          e.target.value.replace(
                            /\D/g,
                            ""
                          )
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                      placeholder="10-digit mobile number"
                    />
                  </div>


                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Date of Birth
                    </label>

                    <input
                      type="date"
                      value={
                        form.dateOfBirth
                      }
                      onChange={(e) =>
                        updateForm(
                          "dateOfBirth",
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                    />
                  </div>


                  <div className="md:col-span-2">

                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Gender
                    </label>

                    <select
                      value={
                        form.gender
                      }
                      onChange={(e) =>
                        updateForm(
                          "gender",
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                    >
                      <option value="">
                        Select Gender
                      </option>

                      <option value="Male">
                        Male
                      </option>

                      <option value="Female">
                        Female
                      </option>

                      <option value="Other">
                        Other
                      </option>
                    </select>

                  </div>

                </div>

              </section>


              {/* ADDRESS */}

              <section>

                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Address
                </h3>

                <div className="space-y-4">

                  <div>

                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Address
                    </label>

                    <textarea
                      value={
                        form.address
                      }
                      onChange={(e) =>
                        updateForm(
                          "address",
                          e.target.value
                        )
                      }
                      rows="2"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                      placeholder="House / Street / Area"
                    />

                  </div>


                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                    <div>

                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        City
                      </label>

                      <input
                        value={
                          form.city
                        }
                        onChange={(e) =>
                          updateForm(
                            "city",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                        placeholder="City"
                      />

                    </div>


                    <div>

                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        State
                      </label>

                      <input
                        value={
                          form.state
                        }
                        onChange={(e) =>
                          updateForm(
                            "state",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                        placeholder="State"
                      />

                    </div>


                    <div>

                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Pincode
                      </label>

                      <input
                        maxLength="6"
                        value={
                          form.pincode
                        }
                        onChange={(e) =>
                          updateForm(
                            "pincode",
                            e.target.value.replace(
                              /\D/g,
                              ""
                            )
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                        placeholder="600000"
                      />

                    </div>

                  </div>

                </div>

              </section>


              {/* KYC */}

              <section>

                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  KYC Details
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                  <div>

                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      PAN Number
                    </label>

                    <input
                      maxLength="10"
                      value={
                        form.panNumber
                      }
                      onChange={(e) =>
                        updateForm(
                          "panNumber",
                          e.target.value.toUpperCase()
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-brand-500"
                      placeholder="ABCDE1234F"
                    />

                  </div>


                  <div>

                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Aadhaar Number
                    </label>

                    <input
                      maxLength="12"
                      value={
                        form.aadhaarNumber
                      }
                      onChange={(e) =>
                        updateForm(
                          "aadhaarNumber",
                          e.target.value.replace(
                            /\D/g,
                            ""
                          )
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                      placeholder="12-digit Aadhaar number"
                    />

                  </div>

                </div>

              </section>


              {/* ACCOUNT DETAILS */}

              <section>

                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Account Details
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                  <div>

                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Account Type
                    </label>

                    <select
                      value={
                        form.accountType
                      }
                      onChange={(e) =>
                        updateForm(
                          "accountType",
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                    >
                      {ACCOUNT_TYPES.map(
                        (type) => (
                          <option
                            key={type}
                            value={type}
                          >
                            {type}
                          </option>
                        )
                      )}
                    </select>

                  </div>


                  <div>

                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Initial Deposit
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        form.initialDeposit
                      }
                      onChange={(e) =>
                        updateForm(
                          "initialDeposit",
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                      placeholder="₹0"
                    />

                  </div>

                </div>

              </section>


              {/* TRANSACTION PIN */}

              <section>

                <div className="mb-3 flex items-center gap-2">

                  <FiShield className="text-brand-600" />

                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Transaction Security
                  </h3>

                </div>


                <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">

                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    4-Digit Transaction PIN
                  </label>

                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength="4"
                    value={
                      form.transactionPin
                    }
                    onChange={(e) =>
                      updateForm(
                        "transactionPin",
                        e.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-center text-lg tracking-[0.5em] outline-none focus:border-brand-500"
                    placeholder="••••"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    This PIN will be required when making fund transfers from this account.
                  </p>

                </div>

              </section>


              {/* NOMINEE */}

              <section>

                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Nominee Details
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                  <div>

                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Nominee Name
                    </label>

                    <input
                      value={
                        form.nomineeName
                      }
                      onChange={(e) =>
                        updateForm(
                          "nomineeName",
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                      placeholder="Nominee name"
                    />

                  </div>


                  <div>

                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Relationship
                    </label>

                    <select
                      value={
                        form.nomineeRelationship
                      }
                      onChange={(e) =>
                        updateForm(
                          "nomineeRelationship",
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                    >

                      <option value="">
                        Select
                      </option>

                      {RELATIONSHIPS.map(
                        (
                          relationship
                        ) => (
                          <option
                            key={
                              relationship
                            }
                            value={
                              relationship
                            }
                          >
                            {
                              relationship
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>


                  <div>

                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Nominee Phone
                    </label>

                    <input
                      type="tel"
                      maxLength="10"
                      value={
                        form.nomineePhone
                      }
                      onChange={(e) =>
                        updateForm(
                          "nomineePhone",
                          e.target.value.replace(
                            /\D/g,
                            ""
                          )
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                      placeholder="10-digit number"
                    />

                  </div>

                </div>

              </section>


              {/* BUTTONS */}

              <div className="sticky bottom-0 flex gap-3 border-t border-slate-100 bg-white pt-4">

                <button
                  type="button"
                  onClick={
                    closeCreateModal
                  }
                  disabled={
                    creating
                  }
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={
                    creating ||
                    !form.bankId
                  }
                  className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating
                    ? "Creating..."
                    : "Create Account"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}


      {/* =====================================================
          MONEY MODAL
      ===================================================== */}

      {moneyModal && (
        <MoneyModal
          mode={
            moneyModal.mode
          }
          account={
            moneyModal.account
          }
          onClose={() =>
            setMoneyModal(null)
          }
          onSuccess={
            handleMoneySuccess
          }
        />
      )}


      {/* =====================================================
          MESSAGE MODAL
      ===================================================== */}

      {messageModal && (
        <MessageModal
          type={
            messageModal.type
          }
          title={
            messageModal.title
          }
          message={
            messageModal.message
          }
          onClose={() =>
            setMessageModal(null)
          }
        />
      )}

    </div>
  );
};

export default Accounts;