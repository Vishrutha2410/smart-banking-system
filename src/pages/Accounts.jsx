import { useEffect, useState } from "react";
import { FaWallet } from "react-icons/fa";

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/accounts",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data.message);
        alert(data.message || "Failed to fetch accounts");
        return;
      }

      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      alert("Cannot connect to the server");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <p className="text-slate-600">
          Loading accounts...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          My Accounts
        </h1>

        <p className="text-slate-500 mt-2">
          Manage and view your banking accounts.
        </p>
      </div>

      {/* No Accounts */}
      {accounts.length === 0 ? (
        <div className="bg-white mt-8 p-10 rounded-2xl shadow-sm border border-slate-200 text-center">
          
          <FaWallet className="mx-auto text-5xl text-blue-600" />

          <h2 className="text-xl font-semibold text-slate-800 mt-5">
            No Account Found
          </h2>

          <p className="text-slate-500 mt-2">
            You don't have any bank accounts yet.
          </p>

        </div>
      ) : (
        
        /* Account Cards */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">

          {accounts.map((account) => (
            <div
              key={account._id}
              className="bg-gradient-to-br from-blue-700 to-blue-950 text-white p-7 rounded-3xl shadow-lg"
            >
              {/* Account Type */}
              <div className="flex justify-between items-center">

                <p className="text-blue-200 text-sm">
                  {account.accountType} Account
                </p>

                <FaWallet className="text-2xl text-blue-200" />

              </div>

              {/* Balance */}
              <div className="mt-6">

                <p className="text-blue-200 text-sm">
                  Available Balance
                </p>

                <h2 className="text-3xl font-bold mt-2">
                  ₹
                  {Number(
                    account.balance || 0
                  ).toLocaleString("en-IN")}
                </h2>

              </div>

              {/* Account Number */}
              <div className="mt-8">

                <p className="text-blue-200 text-sm">
                  Account Number
                </p>

                <p className="font-semibold mt-1 tracking-wide">
                  {account.accountNumber}
                </p>

              </div>

              {/* Status */}
              <div className="flex justify-between items-center mt-6">

                <span className="bg-white/10 px-3 py-1 rounded-full text-sm">
                  {account.status}
                </span>

                <span className="text-blue-200 text-sm">
                  {account.currency}
                </span>

              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}