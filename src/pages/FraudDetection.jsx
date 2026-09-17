import { useEffect, useState } from "react";
import { FiShield, FiCheck, FiX } from "react-icons/fi";
import { getFraudAlerts, setFraudAlertStatus } from "../services/fraudService";
import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

const SEVERITY_STYLES = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-amber-50 text-amber-700",
  High: "bg-orange-50 text-orange-700",
  Critical: "bg-red-50 text-red-700",
};

const FraudDetection = () => {
  const [alerts, setAlerts] = useState([]);
  const [status, setStatus] = useState("loading");

  const load = async () => {
    setStatus("loading");
    try {
      const data = await getFraudAlerts();
      setAlerts(data);
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      const updated = await setFraudAlertStatus(id, newStatus);
      setAlerts((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
    } catch (err) {
      // no-op
    }
  };

  if (status === "loading") return <Loader label="Loading fraud alerts..." />;
  if (status === "error") return <ErrorState onRetry={load} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fraud Detection</h1>
        <p className="text-sm text-slate-500">
          Rule-based alerts generated from unusual activity on your account.
        </p>
      </div>

      {alerts.length === 0 ? (
        <EmptyState title="No fraud alerts." icon={FiShield} message="You're all clear — no suspicious activity detected." />
      ) : (
        <ul className="space-y-3">
          {alerts.map((a) => (
            <li key={a._id} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${SEVERITY_STYLES[a.severity]}`}
                    >
                      {a.severity}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-800">{a.message}</p>
                  {a.transaction && (
                    <p className="mt-1 text-xs text-slate-400">
                      Ref: {a.transaction.referenceNumber}
                    </p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-500">
                  {a.status}
                </span>
              </div>

              {a.status === "open" && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => updateStatus(a._id, "reviewed")}
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    <FiCheck /> Mark Reviewed
                  </button>
                  <button
                    onClick={() => updateStatus(a._id, "dismissed")}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <FiX /> Dismiss
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FraudDetection;
