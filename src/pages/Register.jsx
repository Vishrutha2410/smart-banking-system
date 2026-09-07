import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaUniversity,
  FaGoogle,
  FaEye,
  FaEyeSlash,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  // Check empty fields
  if (
    !formData.name ||
    !formData.email ||
    !formData.phone ||
    !formData.password ||
    !formData.confirmPassword
  ) {
    alert("Please fill in all fields.");
    return;
  }

  // Password validation
  if (formData.password.length < 8) {
    alert("Password must contain at least 8 characters.");
    return;
  }

  // Confirm password validation
  if (formData.password !== formData.confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:5000/api/auth/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Registration failed");
      return;
    }

    alert("Registration successful! Please login.");

    // Optional: automatically save user and login
    localStorage.setItem("token", data.token);

    localStorage.setItem(
      "user",
      JSON.stringify(data.user)
    );

    navigate("/dashboard");

  } catch (error) {
    console.error("Registration Error:", error);
    alert("Unable to connect to the backend server.");
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-800 to-cyan-500 flex items-center justify-center p-6">

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden grid lg:grid-cols-2"
      >

        {/* =====================================================
            LEFT SIDE
        ====================================================== */}

        <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950 text-white p-12 flex-col justify-center">

          {/* Decorative circles */}

          <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-400/20 rounded-full" />

          <div className="absolute -bottom-32 -right-20 w-96 h-96 bg-blue-400/20 rounded-full" />

          <div className="relative z-10">

            <div className="flex items-center gap-3">

              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">

                <FaUniversity className="text-3xl" />

              </div>

              <div>

                <h2 className="text-2xl font-bold">
                  SmartBank AI
                </h2>

                <p className="text-blue-200 text-sm">
                  Intelligent Digital Banking
                </p>

              </div>

            </div>

            <div className="mt-16">

              <h1 className="text-5xl font-bold leading-tight">
                Banking that
                <span className="text-cyan-300">
                  {" "}thinks with you.
                </span>
              </h1>

              <p className="mt-6 text-blue-100 text-lg leading-8 max-w-md">
                Create your SmartBank account and experience
                secure banking powered by Artificial Intelligence.
              </p>

            </div>

            {/* Benefits */}

            <div className="mt-10 space-y-5">

              <div className="flex items-center gap-4">

                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  🔐
                </div>

                <div>
                  <p className="font-semibold">
                    Secure Banking
                  </p>

                  <p className="text-blue-200 text-sm">
                    Protected authentication and transactions
                  </p>
                </div>

              </div>

              <div className="flex items-center gap-4">

                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  🤖
                </div>

                <div>
                  <p className="font-semibold">
                    AI Financial Assistant
                  </p>

                  <p className="text-blue-200 text-sm">
                    Intelligent insights for your finances
                  </p>
                </div>

              </div>

              <div className="flex items-center gap-4">

                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  📊
                </div>

                <div>
                  <p className="font-semibold">
                    Smart Expense Tracking
                  </p>

                  <p className="text-blue-200 text-sm">
                    Understand and manage your spending
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* =====================================================
            RIGHT SIDE - REGISTER FORM
        ====================================================== */}

        <div className="p-8 sm:p-10 lg:p-12">

          {/* Mobile Logo */}

          <div className="lg:hidden flex items-center gap-3 mb-8">

            <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center">

              <FaUniversity />

            </div>

            <div>

              <h2 className="font-bold text-xl">
                SmartBank AI
              </h2>

              <p className="text-gray-500 text-xs">
                Intelligent Digital Banking
              </p>

            </div>

          </div>

          {/* Heading */}

          <div>

            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Create your account
            </h1>

            <p className="mt-3 text-gray-500">
              Join the future of intelligent digital banking.
            </p>

          </div>

          {/* Google Sign Up */}

          <button
            type="button"
            className="w-full mt-7 border border-gray-200 hover:bg-gray-50 p-3.5 rounded-xl flex items-center justify-center gap-3 font-medium text-gray-700 transition duration-200"
          >

            <FaGoogle className="text-red-500" />

            Continue with Google

          </button>

          {/* Divider */}

          <div className="flex items-center gap-4 my-6">

            <div className="flex-1 h-px bg-gray-200" />

            <span className="text-sm text-gray-400">
              OR
            </span>

            <div className="flex-1 h-px bg-gray-200" />

          </div>

          {/* Form */}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* Full Name */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>

              <div className="relative">

                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full border border-gray-200 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />

              </div>

            </div>

            {/* Email */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>

              <div className="relative">

                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full border border-gray-200 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />

              </div>

            </div>

            {/* Phone */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>

              <div className="relative">

                <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full border border-gray-200 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />

              </div>

            </div>

            {/* Password */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>

              <div className="relative">

                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className="w-full border border-gray-200 rounded-xl py-3.5 pl-11 pr-12 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                >
                  {showPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}
                </button>

              </div>

              <p className="text-xs text-gray-400 mt-2">
                Use at least 8 characters.
              </p>

            </div>

            {/* Confirm Password */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>

              <div className="relative">

                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="w-full border border-gray-200 rounded-xl py-3.5 pl-11 pr-12 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}
                </button>

              </div>

            </div>

            {/* Terms */}

            <label className="flex items-start gap-3 pt-1 cursor-pointer">

              <input
                type="checkbox"
                required
                className="mt-1 w-4 h-4 accent-blue-600"
              />

              <span className="text-sm text-gray-500 leading-5">

                I agree to the{" "}

                <a
                  href="#"
                  className="text-blue-600 hover:underline"
                >
                  Terms of Service
                </a>

                {" "}and{" "}

                <a
                  href="#"
                  className="text-blue-600 hover:underline"
                >
                  Privacy Policy
                </a>

              </span>

            </label>

            {/* Register */}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white py-3.5 rounded-xl font-semibold text-lg transition duration-200 shadow-lg shadow-blue-600/20"
            >
              Create Account
            </button>

          </form>

          {/* Login */}

          <p className="text-center text-sm text-gray-500 mt-7">

            Already have an account?

            <Link
              to="/login"
              className="text-blue-600 font-semibold ml-1 hover:underline"
            >
              Login
            </Link>

          </p>

        </div>

      </motion.div>

    </div>
  );
}