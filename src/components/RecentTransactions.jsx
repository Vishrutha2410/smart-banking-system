import {
  FaArrowDown,
  FaArrowUp,
  FaUtensils,
  FaShoppingBag,
  FaBus,
  FaMoneyBillWave,
} from "react-icons/fa";

export default function RecentTransactions() {
  const transactions = [
    {
      name: "Salary Credit",
      category: "Income",
      amount: "+ ₹45,000",
      type: "income",
      date: "Aug 05, 2026",
      icon: <FaMoneyBillWave />,
    },
    {
      name: "Amazon",
      category: "Shopping",
      amount: "- ₹2,499",
      type: "expense",
      date: "Aug 04, 2026",
      icon: <FaShoppingBag />,
    },
    {
      name: "Swiggy",
      category: "Food",
      amount: "- ₹650",
      type: "expense",
      date: "Aug 03, 2026",
      icon: <FaUtensils />,
    },
    {
      name: "Uber",
      category: "Travel",
      amount: "- ₹420",
      type: "expense",
      date: "Aug 02, 2026",
      icon: <FaBus />,
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h3 className="text-lg font-bold text-slate-900">
            Recent Transactions
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Your latest account activity
          </p>

        </div>

        <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
          View All
        </button>

      </div>

      {/* Transactions */}

      <div className="mt-5 divide-y divide-slate-100">

        {transactions.map((transaction, index) => (

          <div
            key={index}
            className="py-4 flex items-center justify-between gap-4"
          >

            {/* Left */}

            <div className="flex items-center gap-4 min-w-0">

              <div
                className={`
                  w-11 h-11
                  rounded-xl
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                  ${
                    transaction.type === "income"
                      ? "bg-green-100 text-green-600"
                      : "bg-blue-50 text-blue-600"
                  }
                `}
              >
                {transaction.icon}
              </div>

              <div className="min-w-0">

                <p className="font-medium text-slate-800 truncate">
                  {transaction.name}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  {transaction.category} • {transaction.date}
                </p>

              </div>

            </div>

            {/* Amount */}

            <div className="text-right flex-shrink-0">

              <p
                className={`
                  font-semibold
                  ${
                    transaction.type === "income"
                      ? "text-green-600"
                      : "text-slate-800"
                  }
                `}
              >
                {transaction.amount}
              </p>

              <p className="text-xs text-green-500 mt-1">
                Completed
              </p>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}