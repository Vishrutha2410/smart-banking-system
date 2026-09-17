const EmptyState = ({ title = "Nothing here yet", message, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center">
    {Icon && <Icon className="mb-3 h-8 w-8 text-slate-300" />}
    <p className="font-medium text-slate-600">{title}</p>
    {message && <p className="mt-1 max-w-sm text-sm text-slate-400">{message}</p>}
  </div>
);

export default EmptyState;
