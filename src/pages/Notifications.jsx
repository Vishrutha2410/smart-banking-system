import { useEffect, useState } from "react";
import { FiBell, FiCheck } from "react-icons/fi";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../services/notificationService";
import { useNotifications } from "../context/NotificationContext";
import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

const TYPE_STYLES = {
  transfer: "bg-brand-50 text-brand-700",
  fraud: "bg-red-50 text-red-700",
  loan: "bg-amber-50 text-amber-700",
  account: "bg-emerald-50 text-emerald-700",
  budget: "bg-orange-50 text-orange-700",
  general: "bg-slate-100 text-slate-600",
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [status, setStatus] = useState("loading");
  const { refresh: refreshGlobal } = useNotifications();

  const load = async () => {
    setStatus("loading");
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      refreshGlobal();
    } catch (err) {
      // no-op
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      refreshGlobal();
    } catch (err) {
      // no-op
    }
  };

  if (status === "loading") return <Loader label="Loading notifications..." />;
  if (status === "error") return <ErrorState onRetry={load} />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500">Updates about your account activity.</p>
        </div>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <FiCheck /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="No notifications" icon={FiBell} />
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n._id}
              className={`rounded-xl border p-4 shadow-sm ${
                n.read ? "border-slate-100 bg-white" : "border-brand-100 bg-brand-50/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLES[n.type] || TYPE_STYLES.general}`}
                    >
                      {n.type}
                    </span>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-brand-600" />}
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-800">{n.title}</p>
                  <p className="text-sm text-slate-500">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                {!n.read && (
                  <button
                    onClick={() => handleMarkRead(n._id)}
                    className="shrink-0 text-xs font-medium text-brand-600 hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
