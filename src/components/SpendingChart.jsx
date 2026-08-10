export default function SpendingChart() {
  const spendingData = [
    { month: "Jan", value: 45 },
    { month: "Feb", value: 55 },
    { month: "Mar", value: 38 },
    { month: "Apr", value: 68 },
    { month: "May", value: 50 },
    { month: "Jun", value: 72 },
    { month: "Jul", value: 58 },
    { month: "Aug", value: 82 },
    { month: "Sep", value: 62 },
    { month: "Oct", value: 75 },
    { month: "Nov", value: 48 },
    { month: "Dec", value: 65 },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">

      {/* Header */}

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>

          <h3 className="text-lg font-bold text-slate-900">
            Spending Overview
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Your monthly spending pattern
          </p>

        </div>

        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-blue-500">

          <option>2026</option>
          <option>2025</option>

        </select>

      </div>

      {/* Chart */}

      <div className="mt-8">

        <div className="h-64 flex items-end gap-2 sm:gap-4">

          {spendingData.map((item) => (

            <div
              key={item.month}
              className="flex-1 h-full flex flex-col justify-end items-center"
            >

              {/* Bar */}

              <div
                className="w-full max-w-10 bg-blue-500 hover:bg-blue-600 rounded-t-lg transition-all duration-300 cursor-pointer"
                style={{
                  height: `${item.value}%`,
                }}
                title={`${item.month}: ${item.value}%`}
              />

              {/* Month */}

              <span className="text-[10px] sm:text-xs text-slate-400 mt-2">
                {item.month}
              </span>

            </div>

          ))}

        </div>

      </div>

      {/* Bottom information */}

      <div className="mt-6 flex flex-wrap gap-6">

        <div>

          <p className="text-xs text-slate-500">
            Highest Spending
          </p>

          <p className="font-semibold text-slate-800 mt-1">
            August
          </p>

        </div>

        <div>

          <p className="text-xs text-slate-500">
            Monthly Average
          </p>

          <p className="font-semibold text-slate-800 mt-1">
            ₹18,450
          </p>

        </div>

        <div>

          <p className="text-xs text-slate-500">
            Compared to Last Month
          </p>

          <p className="font-semibold text-green-600 mt-1">
            ↓ 4.8%
          </p>

        </div>

      </div>

    </div>
  );
}