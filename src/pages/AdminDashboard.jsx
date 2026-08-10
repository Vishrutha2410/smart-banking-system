import {
  FaUsers,
  FaExchangeAlt,
  FaRupeeSign,
  FaShieldAlt,
  FaUserCheck,
  FaExclamationTriangle,
} from "react-icons/fa";
import PageHeader from "../components/PageHeader";

export default function AdminDashboard() {

  const users = [
    {
      name: "Demo User",
      email: "demo@smartbank.com",
      status: "Active",
      joined: "05 Aug 2026",
    },
    {
      name: "Arun Kumar",
      email: "arun@example.com",
      status: "Active",
      joined: "04 Aug 2026",
    },
    {
      name: "Priya Sharma",
      email: "priya@example.com",
      status: "Pending",
      joined: "03 Aug 2026",
    },
    {
      name: "Rahul Das",
      email: "rahul@example.com",
      status: "Active",
      joined: "02 Aug 2026",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-7xl mx-auto p-6 lg:p-8">

        <PageHeader
          title="Admin Dashboard"
          description="Monitor users, transactions and system activity."
        />

        {/* Statistics */}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">

          <AdminStat
            icon={<FaUsers />}
            title="Total Users"
            value="12,548"
          />

          <AdminStat
            icon={<FaExchangeAlt />}
            title="Transactions"
            value="48,920"
          />

          <AdminStat
            icon={<FaRupeeSign />}
            title="Transaction Volume"
            value="₹8.4 Cr"
          />

          <AdminStat
            icon={<FaShieldAlt />}
            title="Security Alerts"
            value="23"
          />

        </div>

        {/* System Status */}

        <div className="grid lg:grid-cols-3 gap-6 mt-6">

          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-xl font-bold">
                  Recent Users
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Recently registered customers
                </p>

              </div>

              <button className="text-blue-600 text-sm font-medium">
                View All
              </button>

            </div>

            <div className="mt-5 overflow-x-auto">

              <table className="w-full">

                <thead>

                  <tr className="border-b border-slate-100">

                    <th className="text-left p-3 text-xs text-slate-500">
                      User
                    </th>

                    <th className="text-left p-3 text-xs text-slate-500">
                      Joined
                    </th>

                    <th className="text-right p-3 text-xs text-slate-500">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {users.map((user) => (

                    <tr
                      key={user.email}
                      className="border-b border-slate-50"
                    >

                      <td className="p-3">

                        <div className="flex items-center gap-3">

                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <FaUserCheck />
                          </div>

                          <div>

                            <p className="font-medium text-sm">
                              {user.name}
                            </p>

                            <p className="text-xs text-slate-500">
                              {user.email}
                            </p>

                          </div>

                        </div>

                      </td>

                      <td className="p-3 text-sm text-slate-500">
                        {user.joined}
                      </td>

                      <td className="p-3 text-right">

                        <span
                          className={`text-xs px-3 py-1 rounded-full ${
                            user.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {user.status}
                        </span>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

          {/* Alerts */}

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                <FaExclamationTriangle />
              </div>

              <div>

                <h2 className="font-bold">
                  Security Alerts
                </h2>

                <p className="text-xs text-slate-500">
                  Requires attention
                </p>

              </div>

            </div>

            <div className="mt-6 space-y-4">

              <Alert
                title="Suspicious Transaction"
                description="High-value transaction detected."
              />

              <Alert
                title="Multiple Login Attempts"
                description="Several failed login attempts."
              />

              <Alert
                title="Unusual Location"
                description="Login from an unfamiliar location."
              />

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

function AdminStat({ icon, title, value }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">

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

function Alert({ title, description }) {
  return (
    <div className="bg-red-50 rounded-xl p-4">

      <p className="font-medium text-red-800 text-sm">
        {title}
      </p>

      <p className="text-xs text-red-600 mt-1">
        {description}
      </p>

      <button className="text-xs font-medium text-red-700 mt-3">
        Review →
      </button>

    </div>
  );
}