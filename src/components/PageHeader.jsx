import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function PageHeader({
  title,
  description,
  action,
  actionIcon,
}) {
  const navigate = useNavigate();

  return (
    <div className="mb-8">

      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition mb-4"
      >
        <FaArrowLeft />
        Back to Dashboard
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {title}
          </h1>

          {description && (
            <p className="text-slate-500 mt-2">
              {description}
            </p>
          )}
        </div>

        {action && (
          <button
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-medium transition"
          >
            {actionIcon}
            {action}
          </button>
        )}

      </div>

    </div>
  );
}