import {
  useEffect,
  useState,
} from "react";

import {
  FiBookOpen,
  FiSave,
  FiTarget,
} from "react-icons/fi";

import {
  getStudentProfile,
  updateStudentProfile,
} from "../services/studentService";

const initialForm = {
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

const StudentProfile = () => {
  const [form, setForm] =
    useState(initialForm);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const profile =
        await getStudentProfile();

      if (profile) {
        setForm({
          collegeName:
            profile.collegeName ||
            "",

          studentId:
            profile.studentId ||
            "",

          course:
            profile.course ||
            "",

          department:
            profile.department ||
            "",

          yearOfStudy:
            profile.yearOfStudy ||
            "1st Year",

          graduationYear:
            profile.graduationYear ||
            "",

          monthlyAllowance:
            profile.monthlyAllowance ??
            "",

          savingsGoalName:
            profile.savingsGoalName ||
            "",

          savingsGoalTarget:
            profile.savingsGoalTarget ??
            "",
        });
      }
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load student profile."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

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

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.collegeName.trim()) {
      setError(
        "College or university name is required."
      );
      return;
    }

    if (!form.studentId.trim()) {
      setError(
        "Student ID is required."
      );
      return;
    }

    if (!form.course.trim()) {
      setError(
        "Course is required."
      );
      return;
    }

    setSaving(true);

    try {
      await updateStudentProfile(
        form
      );

      setSuccess(
        "Student profile updated successfully."
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to update student profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-sm text-slate-500">
        Loading student profile...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* HEADER */}

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
          Student Banking
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Student Profile
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your education details,
          allowance and savings goals.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >

        {/* EDUCATION */}

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <FiBookOpen />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Education Information
              </h2>

              <p className="text-xs text-slate-500">
                Information used for your student banking profile.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">

            <Field
              label="College / University"
              name="collegeName"
              value={form.collegeName}
              onChange={handleChange}
              placeholder="Anna University"
              required
            />

            <Field
              label="Student ID"
              name="studentId"
              value={form.studentId}
              onChange={handleChange}
              placeholder="2026CS1234"
              required
            />

            <Field
              label="Course / Degree"
              name="course"
              value={form.course}
              onChange={handleChange}
              placeholder="B.E Computer Science"
              required
            />

            <Field
              label="Department"
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="Computer Science and Engineering"
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
              onChange={handleChange}
              placeholder="2028"
            />

          </div>
        </section>

        {/* FINANCIAL PLANNING */}

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <FiTarget />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Student Financial Planning
              </h2>

              <p className="text-xs text-slate-500">
                Used by your student budget and financial planning features.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">

            <Field
              label="Monthly Allowance / Income"
              name="monthlyAllowance"
              type="number"
              value={
                form.monthlyAllowance
              }
              onChange={handleChange}
              placeholder="15000"
              min="0"
            />

            <Field
              label="Savings Goal Name"
              name="savingsGoalName"
              value={
                form.savingsGoalName
              }
              onChange={handleChange}
              placeholder="Laptop Fund"
            />

            <Field
              label="Savings Goal Target"
              name="savingsGoalTarget"
              type="number"
              value={
                form.savingsGoalTarget
              }
              onChange={handleChange}
              placeholder="60000"
              min="0"
            />

          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiSave />

          {saving
            ? "Saving..."
            : "Save Student Profile"}
        </button>

      </form>
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
  required = false,
  min,
}) => {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
      />
    </div>
  );
};

export default StudentProfile;