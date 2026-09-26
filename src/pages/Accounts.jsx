import { useEffect, useState } from "react";

import {
  FiPlus,
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiUser,
} from "react-icons/fi";

import {
  getAccounts,
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


// =====================================================
// MONEY MODAL
// =====================================================

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

  const handleSubmit = async (e) => {
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
      const action = isCredit
        ? creditAccount
        : debitAccount;

      const result =
        await action(
          account._id,
          numericAmount,
          description
        );

      onSuccess(result.account);
    } catch (err) {
      setError(
        err.message ||
          `Could not ${mode} the account.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">

        <h2 className="text-lg font-semibold text-slate-900">
          {isCredit
            ? "Credit Money"
            : "Debit Money"}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Account ••••{" "}
          {account.accountNumber.slice(-4)}
          {" — "}
          Current balance: ₹
          {account.balance.toLocaleString(
            "en-IN"
          )}
        </p>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4"
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="0.00"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Description (optional)
            </label>

            <input
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder={
                isCredit
                  ? "e.g. Salary deposit"
                  : "e.g. Grocery shopping"
              }
            />
          </div>

          <div className="flex gap-3">

            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60 ${
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


// =====================================================
// ACCOUNTS PAGE
// =====================================================

const Accounts = () => {

  const { user } = useAuth();

  const [accounts, setAccounts] =
    useState([]);

  const [status, setStatus] =
    useState("loading");

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [moneyModal, setMoneyModal] =
    useState(null);

  const [creating, setCreating] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const { refresh: refreshNotifications } =
    useNotifications();


  // =====================================================
  // FORM
  // =====================================================

  const [form, setForm] = useState({
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
  });


  // =====================================================
  // LOAD ACCOUNTS
  // =====================================================

  const load = async () => {
    setStatus("loading");

    try {
      const data =
        await getAccounts();

      setAccounts(
        Array.isArray(data)
          ? data
          : []
      );

      setStatus("success");
    } catch (err) {
      console.error(
        "[Accounts] Failed to load accounts:",
        err
      );

      setStatus("error");
    }
  };


  useEffect(() => {
    load();
  }, []);


  // =====================================================
  // PREFILL USER INFORMATION
  // =====================================================

  useEffect(() => {
    if (!user) return;

    setForm((previous) => ({
      ...previous,

      // Information already available
      // from registration / Google profile
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
        "",

      address:
        previous.address ||
        user.address ||
        "",
    }));
  }, [user]);


  // =====================================================
  // OPEN CREATE MODAL
  // =====================================================

  const openCreateModal = () => {

    setFormError("");

    // Refresh profile information every
    // time the modal opens.
    setForm((previous) => ({
      ...previous,

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
        previous.mobileNumber ||
        "",

      address:
        user?.address ||
        previous.address ||
        "",
    }));

    setShowCreateModal(true);
  };


  // =====================================================
  // FORM CHANGE
  // =====================================================

  const updateForm = (
    field,
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };


  // =====================================================
  // CREATE ACCOUNT
  // =====================================================

  const handleCreate = async (e) => {

    e.preventDefault();

    setFormError("");

    // -----------------------------
    // Basic validation
    // -----------------------------

    if (!form.fullName.trim()) {
      setFormError(
        "Full name is required."
      );
      return;
    }

    if (!form.email.trim()) {
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

    const deposit =
      Number(form.initialDeposit) || 0;

    if (deposit < 0) {
      setFormError(
        "Initial deposit cannot be negative."
      );
      return;
    }

    setCreating(true);

    try {

      const accountData = {
        accountType:
          form.accountType,

        fullName:
          form.fullName.trim(),

        email:
          form.email.trim(),

        mobileNumber:
          form.mobileNumber.trim(),

        dateOfBirth:
          form.dateOfBirth || null,

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
      };

      const account =
        await createAccount(
          accountData
        );

      setAccounts((previous) => [
        account,
        ...previous,
      ]);

      setShowCreateModal(false);

      refreshNotifications();

      // Reset form while preserving
      // Google/profile information.
      setForm({
        accountType: "Savings",

        fullName:
          user?.name || "",

        email:
          user?.email || "",

        mobileNumber:
          user?.phone || "",

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
      });

    } catch (err) {

      console.error(
        "[Accounts] Create account failed:",
        err
      );

      setFormError(
        err.message ||
          "Could not create account."
      );

    } finally {
      setCreating(false);
    }
  };


  // =====================================================
  // ACCOUNT STATUS
  // =====================================================

  const toggleStatus = async (
    account
  ) => {

    const newStatus =
      account.status === "active"
        ? "inactive"
        : "active";

    try {

      const updated =
        await setAccountStatus(
          account._id,
          newStatus
        );

      setAccounts((previous) =>
        previous.map((item) =>
          item._id === updated._id
            ? updated
            : item
        )
      );

      refreshNotifications();

    } catch (err) {
      console.error(
        "[Accounts] Status update failed:",
        err
      );
    }
  };


  // =====================================================
  // MONEY SUCCESS
  // =====================================================

  const handleMoneySuccess = (
    updatedAccount
  ) => {

    setAccounts((previous) =>
      previous.map((item) =>
        item._id ===
        updatedAccount._id
          ? updatedAccount
          : item
      )
    );

    setMoneyModal(null);

    refreshNotifications();
  };


  // =====================================================
  // LOADING / ERROR
  // =====================================================

  if (status === "loading") {
    return (
      <Loader label="Loading accounts..." />
    );
  }

  if (status === "error") {
    return (
      <ErrorState onRetry={load} />
    );
  }


  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Accounts
          </h1>

          <p className="text-sm text-slate-500">
            Manage your bank accounts.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <FiPlus />
          New Account
        </button>

      </div>


      {/* Accounts */}

      {accounts.length === 0 ? (

        <EmptyState
          title="No accounts found"
          message="Create your first account to get started."
        />

      ) : (

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {accounts.map((account) => (

            <div
              key={account._id}
              className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
            >

              <div className="flex items-center justify-between">

                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                  {account.accountType}
                </span>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    account.status ===
                    "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {account.status}
                </span>

              </div>


              <p className="mt-4 text-sm text-slate-400">
                Account Number
              </p>

              <p className="font-mono text-lg text-slate-900">
                {account.accountNumber}
              </p>


              <p className="mt-3 text-sm text-slate-400">
                Balance
              </p>

              <p className="text-2xl font-bold text-slate-900">
                ₹
                {Number(
                  account.balance || 0
                ).toLocaleString(
                  "en-IN"
                )}
              </p>


              {account.upiId && (
                <p className="mt-3 text-xs text-slate-400">
                  UPI:{" "}
                  <span className="text-slate-600">
                    {account.upiId}
                  </span>
                </p>
              )}


              {account.ifsc && (
                <p className="mt-1 text-xs text-slate-400">
                  IFSC:{" "}
                  <span className="text-slate-600">
                    {account.ifsc}
                  </span>
                </p>
              )}


              <p className="mt-3 text-xs text-slate-400">
                Opened{" "}
                {account.createdAt
                  ? new Date(
                      account.createdAt
                    ).toLocaleDateString(
                      "en-IN"
                    )
                  : "-"}
              </p>


              <div className="mt-4 grid grid-cols-2 gap-2">

                <button
                  onClick={() =>
                    setMoneyModal({
                      mode: "credit",
                      account,
                    })
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
                  onClick={() =>
                    setMoneyModal({
                      mode: "debit",
                      account,
                    })
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


              <button
                onClick={() =>
                  toggleStatus(account)
                }
                className="mt-2 w-full rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {account.status ===
                "active"
                  ? "Deactivate"
                  : "Activate"}
              </button>

            </div>
          ))}

        </div>
      )}


      {/* =================================================
          CREATE ACCOUNT MODAL
          ================================================= */}

      {showCreateModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-6">

          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">

            {/* Modal Header */}

            <div className="flex items-start justify-between">

              <div>

                <h2 className="text-xl font-semibold text-slate-900">
                  Create Bank Account
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter your details to create a new account.
                </p>

              </div>

              {user?.profileImage ? (

                <img
                  src={user.profileImage}
                  alt="Profile"
                  className="h-11 w-11 rounded-full object-cover"
                />

              ) : (

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <FiUser />
                </div>

              )}

            </div>


            {formError && (

              <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {formError}
              </div>

            )}


            <form
              onSubmit={handleCreate}
              className="mt-5 max-h-[70vh] space-y-6 overflow-y-auto pr-1"
            >

              {/* ==========================================
                  PERSONAL DETAILS
                  ========================================== */}

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
                      value={form.fullName}
                      onChange={(e) =>
                        updateForm(
                          "fullName",
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Your full name"
                    />

                  </div>


                  <div>

                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Email
                    </label>

                    <input
                      type="email"
                      value={form.email}
                      readOnly
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                    />

                  </div>


                  <div>

                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Mobile Number
                    </label>

                    <input
                      type="tel"
                      maxLength="10"
                      value={form.mobileNumber}
                      onChange={(e) =>
                        updateForm(
                          "mobileNumber",
                          e.target.value.replace(
                            /\D/g,
                            ""
                          )
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="10-digit mobile number"
                    />

                  </div>


                  <div>

                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Date of Birth
                    </label>

                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) =>
                        updateForm(
                          "dateOfBirth",
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />

                  </div>


                  <div className="md:col-span-2">

                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Gender
                    </label>

                    <select
                      value={form.gender}
                      onChange={(e) =>
                        updateForm(
                          "gender",
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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


              {/* ==========================================
                  ADDRESS
                  ========================================== */}

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
                      value={form.address}
                      onChange={(e) =>
                        updateForm(
                          "address",
                          e.target.value
                        )
                      }
                      rows="2"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="House / Street / Area"
                    />

                  </div>


                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                    <div>

                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        City
                      </label>

                      <input
                        value={form.city}
                        onChange={(e) =>
                          updateForm(
                            "city",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        placeholder="City"
                      />

                    </div>


                    <div>

                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        State
                      </label>

                      <input
                        value={form.state}
                        onChange={(e) =>
                          updateForm(
                            "state",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        placeholder="State"
                      />

                    </div>


                    <div>

                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Pincode
                      </label>

                      <input
                        value={form.pincode}
                        maxLength="6"
                        onChange={(e) =>
                          updateForm(
                            "pincode",
                            e.target.value.replace(
                              /\D/g,
                              ""
                            )
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        placeholder="600000"
                      />

                    </div>

                  </div>

                </div>

              </section>


              {/* ==========================================
                  KYC
                  ========================================== */}

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
                      value={form.panNumber}
                      maxLength="10"
                      onChange={(e) =>
                        updateForm(
                          "panNumber",
                          e.target.value
                            .toUpperCase()
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase"
                      placeholder="ABCDE1234F"
                    />

                  </div>


                  <div>

                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Aadhaar Number
                    </label>

                    <input
                      value={form.aadhaarNumber}
                      maxLength="12"
                      onChange={(e) =>
                        updateForm(
                          "aadhaarNumber",
                          e.target.value.replace(
                            /\D/g,
                            ""
                          )
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="12-digit Aadhaar number"
                    />

                  </div>

                </div>

                <p className="mt-2 text-xs text-slate-400">
                  For your project, these fields are stored as account information. Do not use this demo application as a real KYC system.
                </p>

              </section>


              {/* ==========================================
                  ACCOUNT DETAILS
                  ========================================== */}

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
                      value={form.accountType}
                      onChange={(e) =>
                        updateForm(
                          "accountType",
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
                      value={form.initialDeposit}
                      onChange={(e) =>
                        updateForm(
                          "initialDeposit",
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="₹0"
                    />

                  </div>

                </div>

              </section>


              {/* ==========================================
                  NOMINEE
                  ========================================== */}

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
                      value={form.nomineeName}
                      onChange={(e) =>
                        updateForm(
                          "nomineeName",
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >

                      <option value="">
                        Select
                      </option>

                      {RELATIONSHIPS.map(
                        (relationship) => (
                          <option
                            key={relationship}
                            value={relationship}
                          >
                            {relationship}
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
                      value={form.nomineePhone}
                      onChange={(e) =>
                        updateForm(
                          "nomineePhone",
                          e.target.value.replace(
                            /\D/g,
                            ""
                          )
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="10-digit number"
                    />

                  </div>

                </div>

              </section>


              {/* ==========================================
                  BUTTONS
                  ========================================== */}

              <div className="sticky bottom-0 flex gap-3 bg-white pt-3">

                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(
                      false
                    );
                    setFormError("");
                  }}
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
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


      {/* MONEY MODAL */}

      {moneyModal && (

        <MoneyModal
          mode={moneyModal.mode}
          account={moneyModal.account}
          onClose={() =>
            setMoneyModal(null)
          }
          onSuccess={
            handleMoneySuccess
          }
        />

      )}

    </div>
  );
};

export default Accounts;
