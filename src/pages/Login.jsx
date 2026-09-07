import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import API_URL from "../services/api";
import {
  FaUniversity,
  FaGoogle,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

export default function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
  e.preventDefault();

  if (!formData.email || !formData.password) {
    alert("Please enter your email and password.");
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:5000/api/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Login failed");
      return;
    }

    // Save authentication data
    localStorage.setItem("token", data.token);

    localStorage.setItem(
      "user",
      JSON.stringify(data.user)
    );

    alert("Login successful!");

    navigate("/dashboard");

  } catch (error) {
    console.error("Login Error:", error);
    alert("Unable to connect to the backend server.");
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-800 to-cyan-500 flex items-center justify-center p-6">

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-3xl shadow-2xl overflow-hidden grid lg:grid-cols-2 max-w-6xl w-full"
      >

        {/* =====================================================
            LEFT SIDE
        ====================================================== */}

        <div className="bg-gradient-to-br from-blue-700 to-blue-900 text-white flex flex-col justify-center items-center p-12">

          <FaUniversity size={90} />

          <h1 className="text-5xl font-bold mt-6 text-center">
            Smart Banking
          </h1>

          <p className="text-center mt-6 text-lg opacity-90 max-w-md">
            Welcome back to the future of intelligent digital banking.
          </p>

          <div className="mt-10 space-y-5 text-lg">

            <div>
              ✓ AI Financial Advisor
            </div>

            <div>
              ✓ AI Fraud Detection
            </div>

            <div>
              ✓ AI Chatbot
            </div>

            <div>
              ✓ Smart Budget Planner
            </div>

            <div>
              ✓ OCR Receipt Scanner
            </div>

          </div>

        </div>

        {/* =====================================================
            RIGHT SIDE
        ====================================================== */}

        <div className="p-8 sm:p-12">

          {/* Heading */}

          <h2 className="text-4xl font-bold text-gray-800">
            Welcome Back 👋
          </h2>

          <p className="text-gray-500 mt-3">
            Login to your Smart Banking account
          </p>

          {/* =====================================================
              LOGIN FORM
          ====================================================== */}

          <form onSubmit={handleLogin}>

            {/* Email */}

            <div className="mt-8">

              <label
                htmlFor="email"
                className="font-medium text-gray-700"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full mt-2 border border-gray-300 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />

            </div>

            {/* Password */}

            <div className="mt-5">

              <label
                htmlFor="password"
                className="font-medium text-gray-700"
              >
                Password
              </label>

              <div className="relative">

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full mt-2 border border-gray-300 rounded-xl p-4 pr-12 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
                >
                  {showPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}
                </button>

              </div>

            </div>

            {/* Remember + Forgot */}

            <div className="flex justify-between items-center mt-5">

              <label className="flex items-center gap-2 text-gray-600 text-sm">

                <input
                  type="checkbox"
                  className="w-4 h-4 accent-blue-600"
                />

                Remember Me

              </label>

              <Link
                to="/forgot-password"
                className="text-blue-600 text-sm hover:underline"
              >
                Forgot Password?
              </Link>

            </div>

            {/* Login Button */}

            <button
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-800 text-white p-4 rounded-xl mt-8 text-lg font-semibold transition shadow-lg shadow-blue-700/20"
            >
              Login
            </button>

          </form>

          {/* =====================================================
              DIVIDER
          ====================================================== */}

          <div className="flex items-center my-8">

            <hr className="flex-1 border-gray-200" />

            <span className="mx-4 text-gray-400 text-sm">
              OR
            </span>

            <hr className="flex-1 border-gray-200" />

          </div>

          {/* =====================================================
              GOOGLE LOGIN
          ====================================================== */}

          <button
            type="button"
            onClick={() => {
              alert(
                "Google authentication will be connected later."
              );
            }}
            className="w-full border border-gray-300 p-4 rounded-xl flex justify-center items-center gap-3 hover:bg-gray-50 transition text-gray-700 font-medium"
          >

            <FaGoogle className="text-red-500" />

            Continue with Google

          </button>

          {/* =====================================================
              REGISTER
          ====================================================== */}

          <p className="text-center mt-8 text-gray-600">

            Don't have an account?

            <Link
              to="/register"
              className="text-blue-600 font-semibold ml-2 hover:underline"
            >
              Register
            </Link>

          </p>

        </div>

      </motion.div>

    </div>
  );
}