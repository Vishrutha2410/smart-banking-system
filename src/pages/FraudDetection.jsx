import {
  FaShieldAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaLock,
} from "react-icons/fa";
import PageHeader from "../components/PageHeader";

export default function FraudDetection() {

  const alerts = [
    {
      merchant: "Unknown Online Store",
      amount: "₹8,900",
      date: "04 Aug 2026",
      risk: "High",
      status: "Under Review",
    },
    {
      merchant: "International Purchase",
      amount: "₹3,450",
      date: "01 Aug 2026",
      risk: "Medium",
      status: "Verified",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-7xl mx-auto p-6 lg:p-8">

        <PageHeader
          title="Fraud Detection"
          description="Monitor suspicious transactions and protect your account."
        />

        {/* Security Status */}

        <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-3xl p-7">

          <div className="flex items-center gap-4">

            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">
              <FaShieldAlt />
            </div>

            <div>

              <h2 className="text-xl font-bold">
                Your Account is Protected
              </h2>

              <p className="text-green-100 mt-1 text-sm">
                Our monitoring system is actively checking your transactions.
              </p>

            </div>

          </div>

        </div>

        {/* Statistics */}

        <div className="grid md:grid-cols-3 gap-5 mt-6">

          <SecurityStat
            title="Transactions Monitored"
            value="1,248"
            icon={<FaShieldAlt />}
          />

          <SecurityStat
            title="Threats Detected"
            value="2"
            icon={<FaExclamationTriangle />}
          />

          <SecurityStat
            title="Account Security"
            value="Excellent"
            icon={<FaCheckCircle />}
          />

        </div>

        {/* Alerts */}

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm mt-6 p-6">

          <h2 className="text-xl font-bold">
            Recent Security Alerts
          </h2>

          <div className="mt-5 space-y-4">

            {alerts.map((alert) => (

              <div
                key={`${alert.merchant}-${alert.date}`}
                className="border border-slate-100 rounded-2xl p-5"
              >

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                  <div className="flex gap-4">

                    <div className="w-11 h-11 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                      <FaExclamationTriangle />
                    </div>

                    <div>

                      <h3 className="font-semibold">
                        {alert.merchant}
                      </h3>

                      <p className="text-sm text-slate-500 mt-1">
                        {alert.date}
                      </p>

                    </div>

                  </div>

                  <div className="md:text-right">

                    <p className="font-bold">
                      {alert.amount}
                    </p>

                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        alert.risk === "High"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {alert.risk} Risk
                    </span>

                  </div>

                </div>

                <div className="flex flex-wrap gap-3 mt-5">

                  <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm">
                    <FaLock />
                    Block Transaction
                  </button>

                  <button className="border border-slate-200 px-4 py-2 rounded-lg text-sm hover:bg-slate-50">
                    This Was Me
                  </button>

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>
  );
}

function SecurityStat({ title, value, icon }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">

      <div className="w-11 h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
        {icon}
      </div>

      <p className="text-sm text-slate-500 mt-4">
        {title}
      </p>

      <p className="text-2xl font-bold mt-1">
        {value}
      </p>

    </div>
  );
}