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
  customerType: "personal",
  adminCode: "",
};

const CUSTOMER_TYPES = [
  {
    value: "personal",
    title: "Personal",
    description:
      "For individual personal banking and daily finances.",
  },
  {
    value: "student",
    title: "Student",
    description:
      "For students managing education and personal expenses.",
  },
  {
    value: "business",
    title: "Business",
    description:
      "For business and organization financial management.",
  },
];

const Register = () => {
  const { register } = useAuth();

  const [form, setForm] =
    useState(initialForm);

  const [error, setError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]:
        e.target.value,
    }));
  };

  const validate = () => {
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirmPassword
    ) {
      return "All required fields must be filled in.";
    }

    if (
      !/^\S+@\S+\.\S+$/.test(
        form.email
      )
    ) {
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
      form.role === "member" &&
      ![
        "personal",
        "student",
        "business",
      ].includes(form.customerType)
    ) {
      return "Please select a customer type.";
    }

    if (
      form.role === "admin" &&
      !form.adminCode.trim()
    ) {
      return "An admin registration code is required to register as Admin.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError =
      validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await register(form);
    } catch (err) {
      setError(
        err.message ||
          "Registration failed. Please try again."
      );
    } finally {
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
        className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-100"
      >
        <h1 className="text-2xl font-bold text-slate-900">
          Create your account
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Choose the banking experience that matches your needs.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
        >
          {/* =================================================
              ROLE
          ================================================= */}

          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Register as
            </span>

            <div className="grid grid-cols-2 gap-3">
              {[
                "member",
                "admin",
              ].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        role: r,
                      })
                    )
                  }
                  className={`rounded-lg border py-2 text-sm font-medium capitalize transition ${
                    form.role === r
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* =================================================
              CUSTOMER TYPE
          ================================================= */}

          {form.role === "member" && (
            <div>
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Customer Type
              </span>

              <div className="space-y-2">
                {CUSTOMER_TYPES.map(
                  (type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        setForm(
                          (prev) => ({
                            ...prev,
                            customerType:
                              type.value,
                          })
                        )
                      }
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        form.customerType ===
                        type.value
                          ? "border-brand-600 bg-brand-50 ring-1 ring-brand-500"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">
                          {type.title}
                        </span>

                        <span
                          className={`h-4 w-4 rounded-full border-2 ${
                            form.customerType ===
                            type.value
                              ? "border-brand-600 bg-brand-600"
                              : "border-slate-300"
                          }`}
                        />
                      </div>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {type.description}
                      </p>
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* =================================================
              NAME
          ================================================= */}

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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Jane Smith"
            />
          </div>

          {/* =================================================
              EMAIL
          ================================================= */}

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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="you@example.com"
            />
          </div>

          {/* =================================================
              PHONE
          ================================================= */}

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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="+91 98765 43210"
            />
          </div>

          {/* =================================================
              PASSWORD
          ================================================= */}

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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="At least 6 characters"
            />
          </div>

          {/* =================================================
              CONFIRM PASSWORD
          ================================================= */}

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
              value={
                form.confirmPassword
              }
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Re-enter password"
            />
          </div>

          {/* =================================================
              ADMIN CODE
          ================================================= */}

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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Provided by your organization"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting
              ? "Creating account..."
              : "Create Account"}
          </button>
        </form>

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