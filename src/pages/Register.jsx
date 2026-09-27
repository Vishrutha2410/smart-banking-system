import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { useAuth } from "../context/AuthContext";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  role: "member",
  adminCode: "",
};

const Register = () => {
  const { register } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ======================================================
  // HANDLE INPUT CHANGE
  // ======================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ======================================================
  // VALIDATION
  // ======================================================

  const validate = () => {
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirmPassword
    ) {
      return "All required fields must be filled in.";
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      return "Please enter a valid email address.";
    }

    if (form.password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    if (
      form.password !==
      form.confirmPassword
    ) {
      return "Passwords do not match.";
    }

    if (
      form.role === "admin" &&
      !form.adminCode.trim()
    ) {
      return "An admin registration code is required to register as Admin.";
    }

    return "";
  };

  // ======================================================
  // HANDLE REGISTER
  // ======================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate requests
    if (submitting) {
      return;
    }

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await register(form);

      /*
       * AuthContext redirects to /login after
       * successful registration.
       *
       * We don't manually navigate here because
       * AuthContext handles it.
       */
    } catch (err) {
      setError(
        err?.message ||
          "Registration failed. Please try again."
      );
      setSuccess("");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <motion.div
        initial={{
          opacity: 0,
          y: 16,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
        }}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-100"
      >
        {/* ==================================================
            HEADING
        ================================================== */}

        <h1 className="text-2xl font-bold text-slate-900">
          Create your account
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Create your banking profile first. You can
          choose and create your bank account after
          logging in.
        </p>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ==================================================
            SUCCESS
        ================================================== */}

        {success && (
          <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* ==================================================
            FORM
        ================================================== */}

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
        >
          {/* ==================================================
              ROLE
          ================================================== */}

          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Register as
            </span>

            <div className="grid grid-cols-2 gap-3">
              {["member", "admin"].map((role) => (
                <button
                  key={role}
                  type="button"
                  disabled={submitting}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      role,
                      adminCode:
                        role === "admin"
                          ? prev.adminCode
                          : "",
                    }))
                  }
                  className={`rounded-lg border py-2 text-sm font-medium capitalize transition ${
                    form.role === role
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* ==================================================
              FULL NAME
          ================================================== */}

          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Full Name
            </label>

            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              disabled={submitting}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50"
              placeholder="Jane Smith"
            />
          </div>

          {/* ==================================================
              EMAIL
          ================================================== */}

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              disabled={submitting}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50"
              placeholder="you@example.com"
            />
          </div>

          {/* ==================================================
              PHONE
          ================================================== */}

          <div>
            <label
              htmlFor="phone"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Phone
            </label>

            <input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              disabled={submitting}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50"
              placeholder="+91 98765 43210"
            />
          </div>

          {/* ==================================================
              PASSWORD
          ================================================== */}

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              disabled={submitting}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50"
              placeholder="At least 6 characters"
            />
          </div>

          {/* ==================================================
              CONFIRM PASSWORD
          ================================================== */}

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              disabled={submitting}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50"
              placeholder="Re-enter password"
            />
          </div>

          {/* ==================================================
              ADMIN CODE
          ================================================== */}

          {form.role === "admin" && (
            <div>
              <label
                htmlFor="adminCode"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Admin Registration Code
              </label>

              <input
                id="adminCode"
                name="adminCode"
                type="password"
                value={form.adminCode}
                onChange={handleChange}
                disabled={submitting}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50"
                placeholder="Provided by your organization"
              />
            </div>
          )}

          {/* ==================================================
              SUBMIT
          ================================================== */}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Creating account..."
              : "Create Account"}
          </button>
        </form>

        {/* ==================================================
            LOGIN LINK
        ================================================== */}

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-brand-600 hover:underline"
          >
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;