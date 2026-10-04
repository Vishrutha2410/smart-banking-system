import {
  useEffect,
  useState,
} from "react";

import {
  FiBriefcase,
  FiSave,
} from "react-icons/fi";

import {
  getBusinessProfile,
  updateBusinessProfile,
} from "../services/businessService";

const initialForm = {
  businessName: "",
  businessType: "Sole Proprietorship",
  registrationNumber: "",
  gstNumber: "",
  panNumber: "",
  industry: "",
  businessAddress: "",
  city: "",
  state: "",
  pincode: "",
  annualTurnover: "",
  employeeCount: "",
  contactPerson: "",
  businessPhone: "",
  businessEmail: "",
};

const BusinessProfile = () => {
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

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);

        const profile =
          await getBusinessProfile();

        if (profile) {
          setForm({
            businessName:
              profile.businessName || "",

            businessType:
              profile.businessType ||
              "Sole Proprietorship",

            registrationNumber:
              profile.registrationNumber || "",

            gstNumber:
              profile.gstNumber || "",

            panNumber:
              profile.panNumber || "",

            industry:
              profile.industry || "",

            businessAddress:
              profile.businessAddress || "",

            city:
              profile.city || "",

            state:
              profile.state || "",

            pincode:
              profile.pincode || "",

            annualTurnover:
              profile.annualTurnover ?? "",

            employeeCount:
              profile.employeeCount ?? "",

            contactPerson:
              profile.contactPerson || "",

            businessPhone:
              profile.businessPhone || "",

            businessEmail:
              profile.businessEmail || "",
          });
        }
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load business profile."
        );
      } finally {
        setLoading(false);
      }
    };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.businessName.trim()) {
      setError(
        "Business name is required."
      );
      return;
    }

    setSaving(true);

    try {
      await updateBusinessProfile(
        form
      );

      setSuccess(
        "Business profile updated successfully."
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update business profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-sm text-slate-500">
        Loading business profile...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-600">
          Business Banking
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Business Profile
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your company and business banking information.
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
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <FiBriefcase />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Business Information
              </h2>

              <p className="text-xs text-slate-500">
                Basic information about your business.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Business Name"
              name="businessName"
              value={form.businessName}
              onChange={handleChange}
              required
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Business Type
              </label>

              <select
                name="businessType"
                value={form.businessType}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option>Sole Proprietorship</option>
                <option>Partnership</option>
                <option>Private Limited</option>
                <option>Public Limited</option>
                <option>LLP</option>
                <option>Startup</option>
                <option>Other</option>
              </select>
            </div>

            <Field
              label="Registration Number"
              name="registrationNumber"
              value={form.registrationNumber}
              onChange={handleChange}
            />

            <Field
              label="GST Number"
              name="gstNumber"
              value={form.gstNumber}
              onChange={handleChange}
            />

            <Field
              label="PAN Number"
              name="panNumber"
              value={form.panNumber}
              onChange={handleChange}
            />

            <Field
              label="Industry"
              name="industry"
              value={form.industry}
              onChange={handleChange}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-900">
            Contact Information
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Contact Person"
              name="contactPerson"
              value={form.contactPerson}
              onChange={handleChange}
            />

            <Field
              label="Business Phone"
              name="businessPhone"
              value={form.businessPhone}
              onChange={handleChange}
            />

            <Field
              label="Business Email"
              name="businessEmail"
              type="email"
              value={form.businessEmail}
              onChange={handleChange}
            />

            <Field
              label="City"
              name="city"
              value={form.city}
              onChange={handleChange}
            />

            <Field
              label="State"
              name="state"
              value={form.state}
              onChange={handleChange}
            />

            <Field
              label="PIN Code"
              name="pincode"
              value={form.pincode}
              onChange={handleChange}
            />

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Business Address
              </label>

              <textarea
                name="businessAddress"
                value={form.businessAddress}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-900">
            Business Financial Information
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Annual Turnover"
              name="annualTurnover"
              type="number"
              value={form.annualTurnover}
              onChange={handleChange}
              min="0"
            />

            <Field
              label="Number of Employees"
              name="employeeCount"
              type="number"
              value={form.employeeCount}
              onChange={handleChange}
              min="0"
            />
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          <FiSave />

          {saving
            ? "Saving..."
            : "Save Business Profile"}
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
        required={required}
        min={min}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      />
    </div>
  );
};

export default BusinessProfile;