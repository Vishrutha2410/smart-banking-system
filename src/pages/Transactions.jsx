import { useEffect, useState } from "react";
import { getTransactions } from "../services/transactionService";
import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

const TYPES = ["", "income", "expense", "transfer"];

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [status, setStatus] = useState("loading");
  const [filters, setFilters] = useState({ search: "", type: "", sort: "-date" });
  const [page, setPage] = useState(1);

  const load = async () => {
    setStatus("loading");
    try {
      const data = await getTransactions({ ...filters, page, limit: 10 });
      setTransactions(data.transactions);
      setPagination(data.pagination);
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters.type, filters.sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
        <p className="text-sm text-slate-500">All transactions linked to your accounts.</p>
      </div>

      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
      >
        <input
          type="text"
          placeholder="Search description, category, reference..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <select
          value={filters.type}
          onChange={(e) => {
            setPage(1);
            setFilters((f) => ({ ...f, type: e.target.value }));
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          {TYPES.filter(Boolean).map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={filters.sort}
          onChange={(e) => {
            setPage(1);
            setFilters((f) => ({ ...f, sort: e.target.value }));
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="-date">Newest first</option>
          <option value="date">Oldest first</option>
          <option value="-amount">Amount: high to low</option>
          <option value="amount">Amount: low to high</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Search
        </button>
      </form>

      {status === "loading" && <Loader label="Loading transactions..." />}
      {status === "error" && <ErrorState onRetry={load} />}

      {status === "success" && transactions.length === 0 && (
        <EmptyState title="No transactions yet" message="Transactions will appear here once you make them." />
      )}

      {status === "success" && transactions.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((t) => (
                <tr key={t._id}>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(t.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-slate-800">{t.description || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{t.category}</td>
                  <td className="px-4 py-3 capitalize text-slate-500">{t.type}</td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${
                      t.type === "income" || t.category === "Transfer In"
                        ? "text-emerald-600"
                        : "text-red-500"
                    }`}
                  >
                    {t.type === "income" || t.category === "Transfer In" ? "+" : "-"}₹
                    {t.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-500">{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
            <span className="text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
