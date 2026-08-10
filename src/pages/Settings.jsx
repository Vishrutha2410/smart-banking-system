import { useState } from "react";
import {
  FaUser,
  FaLock,
  FaBell,
  FaShieldAlt,
  FaSave,
} from "react-icons/fa";
import PageHeader from "../components/PageHeader";

export default function Settings() {

  const [notifications, setNotifications] =
    useState(true);

  const [twoFactor, setTwoFactor] =
    useState(false);

  const [profile, setProfile] = useState({
    name: "Demo User",
    email: "demo@smartbank.com",
    phone: "+91 9876543210",
  });

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const saveProfile = () => {
    alert("Profile settings saved.");
  };

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-5xl mx-auto p-6 lg:p-8">

        <PageHeader
          title="Settings"
          description="Manage your profile, security and notification preferences."
        />

        {/* Profile */}

        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <FaUser />
            </div>

            <div>

              <h2 className="font-bold text-lg">
                Profile Information
              </h2>

              <p className="text-sm text-slate-500">
                Update your personal information.
              </p>

            </div>

          </div>

          <div className="grid md:grid-cols-2 gap-5 mt-6">

            <SettingInput
              label="Full Name"
              name="name"
              value={profile.name}
              onChange={handleChange}
            />

            <SettingInput
              label="Email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              type="email"
            />

            <SettingInput
              label="Phone Number"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
            />

          </div>

          <button
            onClick={saveProfile}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-medium flex items-center gap-2"
          >
            <FaSave />
            Save Changes
          </button>

        </section>

        {/* Notifications */}

        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mt-6">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
              <FaBell />
            </div>

            <div>

              <h2 className="font-bold text-lg">
                Notifications
              </h2>

              <p className="text-sm text-slate-500">
                Control how you receive alerts.
              </p>

            </div>

          </div>

          <ToggleSetting
            title="Transaction Notifications"
            description="Receive alerts when money is credited or debited."
            enabled={notifications}
            onChange={() =>
              setNotifications(!notifications)
            }
          />

        </section>

        {/* Security */}

        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mt-6">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
              <FaShieldAlt />
            </div>

            <div>

              <h2 className="font-bold text-lg">
                Security
              </h2>

              <p className="text-sm text-slate-500">
                Protect your SmartBank account.
              </p>

            </div>

          </div>

          <ToggleSetting
            title="Two-Factor Authentication"
            description="Add an additional layer of security to your account."
            enabled={twoFactor}
            onChange={() =>
              setTwoFactor(!twoFactor)
            }
          />

          <button className="mt-5 border border-slate-200 rounded-xl px-5 py-3 flex items-center gap-2 hover:bg-slate-50">
            <FaLock />
            Change Password
          </button>

        </section>

      </div>

    </div>
  );
}

function SettingInput({
  label,
  name,
  value,
  onChange,
  type = "text",
}) {
  return (
    <div>

      <label className="text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border border-slate-200 rounded-xl p-4 mt-2 outline-none focus:ring-2 focus:ring-blue-500"
      />

    </div>
  );
}

function ToggleSetting({
  title,
  description,
  enabled,
  onChange,
}) {
  return (
    <div className="flex items-center justify-between gap-5 mt-6">

      <div>

        <h3 className="font-medium">
          {title}
        </h3>

        <p className="text-sm text-slate-500 mt-1">
          {description}
        </p>

      </div>

      <button
        onClick={onChange}
        className={`w-12 h-7 rounded-full p-1 transition ${
          enabled
            ? "bg-blue-600"
            : "bg-slate-300"
        }`}
      >

        <span
          className={`block w-5 h-5 bg-white rounded-full transition ${
            enabled
              ? "translate-x-5"
              : "translate-x-0"
          }`}
        />

      </button>

    </div>
  );
}