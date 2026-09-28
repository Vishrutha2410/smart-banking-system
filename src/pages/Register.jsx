import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import {
  FiBookOpen,
  FiUser,
  FiBriefcase,
} from "react-icons/fi";

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

  collegeName: "",
  studentId: "",
  course: "",
  department: "",
  yearOfStudy: "1st Year",
  graduationYear: "",
  monthlyAllowance: "",
  savingsGoalName: "",
  savingsGoalTarget: "",
};

const Register = () => {
  const { register } =
    useAuth();

  const [form, setForm] =
    useState(initialForm);

  const [error, setError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const selectCustomerType = (
    customerType
  ) => {
    setForm((previous) => ({
      ...previous,
      customerType,
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

    if (
      form.password.length < 6
    ) {
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
      return "An admin registration code is required.";
    }

    if (
      form.role === "member" &&
      form.customerType ===
        "student"
    ) {
      if (
        !form.collegeName.trim()
      ) {
        return "College or university name is required.";
      }

      if (
        !form.studentId.trim()
      ) {
        return "Student ID is required.";
      }

      if (
        !form.course.trim()
      ) {
        return "Course is required.";
      }

      if (!form.yearOfStudy) {
        return "Year of study is required.";
      }
    }

    return "";
  };

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    if (submitting) {
      return;
    }

    setError("");

    const validationError =
      validate();

    if (validationError) {
      setError(
        validationError
      );
      return;
    }

    setSubmitting(true);

    try {
      await register(form);
    } catch (err) {
      setError(
        err?.message ||
          "Registration failed. Please try again."
      );

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
        className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-100"
      >

        <h1 className="text-2xl font-bold text-slate-900">
          Create your account
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Select your customer type so SmartBank
          can provide the right banking experience.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-6"
        >

          {/* ==================================================
              ROLE
          ================================================== */}

          <div>
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Register as
            </span>

            <div className="grid grid-cols-2 gap-3">

              {[
                "member",
                "admin",
              ].map((role) => (
                <button
                  key={role}
                  type="button"
                  disabled={
                    submitting
                  }
                  onClick={() =>
                    setForm(
                      (
                        previous
                      ) => ({
                        ...previous,
                        role,
                        adminCode:
                          role ===
                          "admin"
                            ? previous.adminCode
                            : "",
                      })
                    )
                  }
                  className={`rounded-lg border py-2.5 text-sm font-medium capitalize transition ${
                    form.role ===
                    role
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {role}
                </button>
              ))}

            </div>
          </div>

          {/* ==================================================
              CUSTOMER TYPE
          ================================================== */}

          {form.role ===
            "member" && (
            <div>

              <span className="mb-2 block text-sm font-medium text-slate-700">
                Customer Type
              </span>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

                <CustomerTypeButton
                  active={
                    form.customerType ===
                    "personal"
                  }
                  icon={FiUser}
                  title="Personal"
                  description="Personal banking"
                  onClick={() =>
                    selectCustomerType(
                      "personal"
                    )
                  }
                />

                <CustomerTypeButton
                  active={
                    form.customerType ===
                    "student"
                  }
                  icon={FiBookOpen}
                  title="Student"
                  description="Student banking"
                  onClick={() =>
                    selectCustomerType(
                      "student"
                    )
                  }
                />

                <CustomerTypeButton
                  active={
                    form.customerType ===
                    "business"
                  }
                  icon={FiBriefcase}
                  title="Business"
                  description="Business banking"
                  onClick={() =>
                    selectCustomerType(
                      "business"
                    )
                  }
                />

              </div>

            </div>
          )}

          {/* ==================================================
              BASIC DETAILS
          ================================================== */}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            <Field
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your full name"
              disabled={submitting}
              required
            />

            <Field
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              disabled={submitting}
              required
            />

            <Field
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              disabled={submitting}
            />

            <div />

            <Field
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              disabled={submitting}
              required
            />

            <Field
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={
                form.confirmPassword
              }
              onChange={handleChange}
              placeholder="Re-enter password"
              disabled={submitting}
              required
            />

          </div>

          {/* ==================================================
              STUDENT DETAILS
          ================================================== */}

          {form.role ===
            "member" &&
            form.customerType ===
              "student" && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">

                <div className="flex items-start gap-3">

                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
                    <FiBookOpen />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Student Information
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      These details create your Student Banking profile.
                    </p>
                  </div>

                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">

                  <Field
                    label="College / University"
                    name="collegeName"
                    value={
                      form.collegeName
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Anna University"
                    disabled={
                      submitting
                    }
                    required
                  />

                  <Field
                    label="Student ID"
                    name="studentId"
                    value={
                      form.studentId
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="2026CS1234"
                    disabled={
                      submitting
                    }
                    required
                  />

                  <Field
                    label="Course / Degree"
                    name="course"
                    value={
                      form.course
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="B.E Computer Science"
                    disabled={
                      submitting
                    }
                    required
                  />

                  <Field
                    label="Department"
                    name="department"
                    value={
                      form.department
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Computer Science"
                    disabled={
                      submitting
                    }
                  />

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Year of Study
                    </label>

                    <select
                      name="yearOfStudy"
                      value={
                        form.yearOfStudy
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        submitting
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                    >
                      <option>
                        1st Year
                      </option>
                      <option>
                        2nd Year
                      </option>
                      <option>
                        3rd Year
                      </option>
                      <option>
                        4th Year
                      </option>
                      <option>
                        5th Year
                      </option>
                      <option>
                        Final Year
                      </option>
                      <option>
                        Other
                      </option>
                    </select>
                  </div>

                  <Field
                    label="Expected Graduation Year"
                    name="graduationYear"
                    type="number"
                    value={
                      form.graduationYear
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="2028"
                    disabled={
                      submitting
                    }
                  />

                  <Field
                    label="Monthly Allowance / Income"
                    name="monthlyAllowance"
                    type="number"
                    value={
                      form.monthlyAllowance
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="15000"
                    disabled={
                      submitting
                    }
                  />

                  <Field
                    label="Savings Goal Name"
                    name="savingsGoalName"
                    value={
                      form.savingsGoalName
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Laptop Fund"
                    disabled={
                      submitting
                    }
                  />

                  <Field
                    label="Savings Goal Target"
                    name="savingsGoalTarget"
                    type="number"
                    value={
                      form.savingsGoalTarget
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="60000"
                    disabled={
                      submitting
                    }
                  />

                </div>
              </div>
            )}

          {/* ==================================================
              ADMIN CODE
          ================================================== */}

          {form.role ===
            "admin" && (
            <Field
              label="Admin Registration Code"
              name="adminCode"
              type="password"
              value={
                form.adminCode
              }
              onChange={
                handleChange
              }
              placeholder="Provided by your organization"
              disabled={submitting}
              required
            />
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

const Field = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  required = false,
}) => {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50"
      />
    </div>
  );
};

const CustomerTypeButton = ({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        active
          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-3">

        <div
          className={`grid h-9 w-9 place-items-center rounded-lg ${
            active
              ? "bg-white text-blue-600"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          <Icon />
        </div>

        <div>
          <p className="text-sm font-bold text-slate-900">
            {title}
          </p>

          <p className="text-xs text-slate-500">
            {description}
          </p>
        </div>

      </div>
    </button>
  );
};

export default Register;