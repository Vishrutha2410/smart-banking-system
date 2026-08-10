export default function StatCard({
  icon,
  title,
  amount,
  change,
  positive = true,
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition">

      <div className="flex items-start justify-between">

        {/* Information */}

        <div>

          <p className="text-sm text-slate-500">
            {title}
          </p>

          <h3 className="text-2xl font-bold text-slate-900 mt-2">
            {amount}
          </h3>

        </div>

        {/* Icon */}

        <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">

          {icon}

        </div>

      </div>

      {/* Change */}

      <div className="mt-4 flex items-center gap-1">

        <span
          className={`
            text-xs font-medium
            ${
              positive
                ? "text-green-600"
                : "text-orange-500"
            }
          `}
        >
          {change}
        </span>

        <span className="text-xs text-slate-400">
          from last month
        </span>

      </div>

    </div>
  );
}