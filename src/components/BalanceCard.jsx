import {
  FaWallet,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { useState } from "react";

export default function BalanceCard() {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white rounded-3xl p-7 shadow-xl">

      {/* Decorative circles */}

      <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-white/5" />

      <div className="absolute -bottom-24 -left-20 w-64 h-64 rounded-full bg-cyan-400/5" />

      <div className="relative z-10">

        {/* Header */}

        <div className="flex items-start justify-between">

          <div>

            <p className="text-blue-200 text-sm">
              Total Balance
            </p>

            <div className="flex items-center gap-3 mt-2">

              <h1 className="text-4xl lg:text-5xl font-bold">
                {showBalance
                  ? "₹1,24,850.00"
                  : "••••••••"}
              </h1>

              <button
                onClick={() =>
                  setShowBalance(!showBalance)
                }
                className="text-blue-200 hover:text-white"
              >
                {showBalance ? (
                  <FaEye />
                ) : (
                  <FaEyeSlash />
                )}
              </button>

            </div>

          </div>

          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">

            <FaWallet className="text-xl" />

          </div>

        </div>

        {/* Account information */}

        <div className="mt-8 flex flex-wrap gap-8">

          <div>

            <p className="text-blue-200 text-xs">
              Account Number
            </p>

            <p className="font-medium mt-1">
              XXXX XXXX 4582
            </p>

          </div>

          <div>

            <p className="text-blue-200 text-xs">
              Account Type
            </p>

            <p className="font-medium mt-1">
              Savings Account
            </p>

          </div>

          <div>

            <p className="text-blue-200 text-xs">
              Status
            </p>

            <p className="font-medium text-green-300 mt-1">
              ● Active
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}