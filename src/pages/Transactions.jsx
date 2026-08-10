import {
  FaArrowDown,
  FaArrowUp,
  FaSearch,
  FaFilter,
} from "react-icons/fa";
import PageHeader from "../components/PageHeader";

export default function Transactions() {

  const transactions = [
    {
      name: "Salary Credit",
      category: "Income",
      date: "05 Aug 2026",
      amount: "+₹45,000",
      type: "credit",
      status: "Completed",
    },
    {
      name: "Amazon",
      category: "Shopping",
      date: "04 Aug 2026",
      amount: "-₹2,499",
      type: "debit",
      status: "Completed",
    },
    {
      name: "Swiggy",
      category: "Food",
      date: "03 Aug 2026",
      amount: "-₹650",
      type: "debit",
      status: "Completed",
    },
    {
      name: "Uber",
      category: "Travel",
      date: "02 Aug 2026",
      amount: "-₹420",
      type: "debit",
      status: "Completed",
    },
    {
      name: "Freelance Payment",
      category: "Income",
      date: "01 Aug 2026",
      amount: "+₹12,500",
      type: "credit",
      status: "Completed",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-7xl mx-auto p-6 lg:p-8">

        <PageHeader
          title="Transactions"
          description="View and manage your complete transaction history."
        />

        {/* Search + Filter */}

        <div className="bg-white rounded-2xl p-4 border border-slate-100 mb-6 flex flex-col md:flex-row gap-4">

          <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3 flex-1">

            <FaSearch className="text-slate-400" />

            <input
              type="text"
              placeholder="Search transactions..."
              className="outline-none w-full"
            />

          </div>

          <button className="flex items-center justify-center gap-2 border border-slate-200 rounded-xl px-5 py-3 text-slate-600 hover:bg-slate-50">
            <FaFilter />
            Filter
          </button>

        </div>

        {/* Transactions */}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-50">

                <tr>
                  <th className="text-left p-5 text-sm text-slate-500">
                    Transaction
                  </th>

                  <th className="text-left p-5 text-sm text-slate-500">
                    Category
                  </th>

                  <th className="text-left p-5 text-sm text-slate-500">
                    Date
                  </th>

                  <th className="text-right p-5 text-sm text-slate-500">
                    Amount
                  </th>

                  <th className="text-right p-5 text-sm text-slate-500">
                    Status
                  </th>
                </tr>

              </thead>

              <tbody>

                {transactions.map((transaction) => (

                  <tr
                    key={`${transaction.name}-${transaction.date}`}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >

                    <td className="p-5">

                      <div className="flex items-center gap-3">

                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            transaction.type === "credit"
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {transaction.type === "credit"
                            ? <FaArrowDown />
                            : <FaArrowUp />}
                        </div>

                        <span className="font-medium">
                          {transaction.name}
                        </span>

                      </div>

                    </td>

                    <td className="p-5 text-slate-500">
                      {transaction.category}
                    </td>

                    <td className="p-5 text-slate-500">
                      {transaction.date}
                    </td>

                    <td
                      className={`p-5 text-right font-semibold ${
                        transaction.type === "credit"
                          ? "text-green-600"
                          : "text-slate-800"
                      }`}
                    >
                      {transaction.amount}
                    </td>

                    <td className="p-5 text-right">

                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
                        {transaction.status}
                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>
  );
}