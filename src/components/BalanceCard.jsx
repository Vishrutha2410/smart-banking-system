import {
  FaWallet,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { useState } from "react";

export default function BalanceCard({
  balance = 0,
  accountNumber = "",
}) {
  return (
    <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-3xl p-6 lg:p-8 text-white shadow-lg">
      
      <p className="text-blue-100 text-sm">
        Total Balance
      </p>

      <h2 className="text-3xl lg:text-4xl font-bold mt-3">
        ₹{Number(balance).toLocaleString("en-IN")}
      </h2>

      <div className="flex justify-between items-end mt-8">
        
        <div>
          <p className="text-blue-200 text-sm">
            Account Number
          </p>

          <p className="font-semibold mt-1">
            {accountNumber
              ? `•••• ${accountNumber.slice(-4)}`
              : "No Account"}
          </p>
        </div>

        <div className="text-right">
          <p className="text-blue-200 text-sm">
            Account Type
          </p>

          <p className="font-semibold mt-1">
            Savings
          </p>
        </div>

      </div>
    </div>
  );
}