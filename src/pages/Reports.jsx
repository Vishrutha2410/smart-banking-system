import {
  FaChartBar,
  FaDownload,
  FaFilePdf,
  FaFileExcel,
} from "react-icons/fa";
import PageHeader from "../components/PageHeader";

export default function Reports() {

  const months = [
    { month: "Jan", income: 70, expense: 45 },
    { month: "Feb", income: 80, expense: 50 },
    { month: "Mar", income: 65, expense: 42 },
    { month: "Apr", income: 90, expense: 60 },
    { month: "May", income: 75, expense: 48 },
    { month: "Jun", income: 95, expense: 55 },
    { month: "Jul", income: 85, expense: 58 },
    { month: "Aug", income: 100, expense: 62 },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-7xl mx-auto p-6 lg:p-8">

        <PageHeader
          title="Reports & Analytics"
          description="Analyze your financial performance and generate reports."
        />

        {/* Summary */}

        <div className="grid sm:grid-cols-3 gap-5">

          <SummaryCard
            title="Total Income"
            value="₹3,82,500"
            change="+12.5%"
          />

          <SummaryCard
            title="Total Expenses"
            value="₹1,54,250"
            change="+4.8%"
          />

          <SummaryCard
            title="Total Savings"
            value="₹2,28,250"
            change="+18.4%"
          />

        </div>

        {/* Chart */}

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mt-6">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <FaChartBar />
            </div>

            <div>

              <h2 className="text-xl font-bold">
                Income vs Expenses
              </h2>

              <p className="text-sm text-slate-500">
                Monthly financial performance
              </p>

            </div>

          </div>

          <div className="h-72 flex items-end gap-3 sm:gap-6 mt-8">

            {months.map((item) => (

              <div
                key={item.month}
                className="flex-1 h-full flex items-end justify-center gap-1 sm:gap-2"
              >

                <div
                  className="w-1/2 bg-blue-500 rounded-t-lg"
                  style={{
                    height: `${item.income}%`,
                  }}
                  title={`Income: ${item.income}`}
                />

                <div
                  className="w-1/2 bg-slate-300 rounded-t-lg"
                  style={{
                    height: `${item.expense}%`,
                  }}
                  title={`Expense: ${item.expense}`}
                />

              </div>

            ))}

          </div>

          <div className="flex justify-between text-xs text-slate-400 mt-3">

            {months.map((item) => (
              <span key={item.month}>
                {item.month}
              </span>
            ))}

          </div>

          <div className="flex gap-6 mt-6 text-sm">

            <div className="flex items-center gap-2">

              <span className="w-3 h-3 rounded-full bg-blue-500" />

              Income

            </div>

            <div className="flex items-center gap-2">

              <span className="w-3 h-3 rounded-full bg-slate-300" />

              Expenses

            </div>

          </div>

        </div>

        {/* Downloads */}

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mt-6">

          <h2 className="text-xl font-bold">
            Generate Reports
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Download your financial reports.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mt-6">

            <button className="border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:bg-slate-50">

              <FaFilePdf className="text-red-500 text-2xl" />

              <div className="text-left">

                <p className="font-medium">
                  PDF Report
                </p>

                <p className="text-xs text-slate-500">
                  Download monthly statement
                </p>

              </div>

              <FaDownload className="ml-auto text-slate-400" />

            </button>

            <button className="border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:bg-slate-50">

              <FaFileExcel className="text-green-600 text-2xl" />

              <div className="text-left">

                <p className="font-medium">
                  Excel Report
                </p>

                <p className="text-xs text-slate-500">
                  Download transaction data
                </p>

              </div>

              <FaDownload className="ml-auto text-slate-400" />

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

function SummaryCard({ title, value, change }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <h3 className="text-2xl font-bold mt-2">
        {value}
      </h3>

      <p className="text-sm text-green-600 mt-2">
        {change} from last month
      </p>

    </div>
  );
}