const Loader = ({ label = "Loading..." }) => (
  <div className="flex items-center justify-center gap-3 py-14 text-slate-500">
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600" />
    <span>{label}</span>
  </div>
);

export default Loader;
