import { useState } from "react";
import {
  FaArrowRight,
  FaUniversity,
  FaUser,
} from "react-icons/fa";
import PageHeader from "../components/PageHeader";

export default function FundTransfer() {

  const [form, setForm] = useState({
    accountNumber: "",
    confirmAccount: "",
    name: "",
    amount: "",
    remarks: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      form.accountNumber !==
      form.confirmAccount
    ) {
      alert("Account numbers do not match.");
      return;
    }

    alert("Transfer request submitted.");
  };

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-4xl mx-auto p-6 lg:p-8">

        <PageHeader
          title="Fund Transfer"
          description="Transfer money securely to another bank account."
        />

        <div className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm">

          <div className="flex items-center gap-3 mb-7">

            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <FaUniversity />
            </div>

            <div>
              <h2 className="font-bold text-lg">
                Bank Transfer
              </h2>

              <p className="text-sm text-slate-500">
                Enter beneficiary details
              </p>
            </div>

          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>

              <label className="text-sm font-medium">
                Beneficiary Name
              </label>

              <div className="relative mt-2">

                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter beneficiary name"
                  required
                  className="w-full border border-slate-200 rounded-xl p-4 pl-11 outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

            </div>

            <div className="grid md:grid-cols-2 gap-5">

              <div>

                <label className="text-sm font-medium">
                  Account Number
                </label>

                <input
                  name="accountNumber"
                  value={form.accountNumber}
                  onChange={handleChange}
                  placeholder="Enter account number"
                  required
                  className="w-full border border-slate-200 rounded-xl p-4 mt-2 outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              <div>

                <label className="text-sm font-medium">
                  Confirm Account Number
                </label>

                <input
                  name="confirmAccount"
                  value={form.confirmAccount}
                  onChange={handleChange}
                  placeholder="Confirm account number"
                  required
                  className="w-full border border-slate-200 rounded-xl p-4 mt-2 outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

            </div>

            <div>

              <label className="text-sm font-medium">
                Amount
              </label>

              <div className="relative mt-2">

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  ₹
                </span>

                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  min="1"
                  required
                  className="w-full border border-slate-200 rounded-xl p-4 pl-9 outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

            </div>

            <div>

              <label className="text-sm font-medium">
                Remarks
              </label>

              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                placeholder="Optional remarks"
                rows="3"
                className="w-full border border-slate-200 rounded-xl p-4 mt-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />

            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition"
            >
              Transfer Money
              <FaArrowRight />
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}