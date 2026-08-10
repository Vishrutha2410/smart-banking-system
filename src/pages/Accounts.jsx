import {
  FaWallet,
  FaUniversity,
  FaCreditCard,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { useState } from "react";
import PageHeader from "../components/PageHeader";

export default function Accounts() {
  const [showBalance, setShowBalance] = useState(true);

  const accounts = [
    {
      name: "Primary Savings Account",
      number: "XXXX XXXX 4582",
      type: "Savings",
      balance: "₹1,24,850",
      icon: <FaWallet />,
    },
    {
      name: "Salary Account",
      number: "XXXX XXXX 7821",
      type: "Current",
      balance: "₹68,450",
      icon: <FaUniversity />,
    },
    {
      name: "Credit Card",
      number: "XXXX XXXX 9012",
      type: "Credit",
      balance: "₹24,600",
      icon: <FaCreditCard />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-7xl mx-auto p-6 lg:p-8">

        <PageHeader
          title="Accounts"
          description="View and manage all your banking accounts."
        />

        {/* Total Balance */}

        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-3xl p-7 mb-7">

          <p className="text-blue-200">
            Total Available Balance
          </p>

          <div className="flex items-center gap-4 mt-2">

            <h2 className="text-4xl font-bold">
              {showBalance ? "₹1,93,300" : "••••••••"}
            </h2>

            <button
              onClick={() =>
                setShowBalance(!showBalance)
              }
            >
              {showBalance ? <FaEye /> : <FaEyeSlash />}
            </button>

          </div>

        </div>

        {/* Accounts */}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {accounts.map((account) => (

            <div
              key={account.number}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition"
            >

              <div className="flex justify-between">

                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
                  {account.icon}
                </div>

                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full h-fit">
                  Active
                </span>

              </div>

              <h3 className="font-bold text-lg mt-5">
                {account.name}
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                {account.number}
              </p>

              <div className="border-t border-slate-100 mt-5 pt-5">

                <p className="text-xs text-slate-500">
                  Available Balance
                </p>

                <p className="text-2xl font-bold mt-1">
                  {account.balance}
                </p>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}