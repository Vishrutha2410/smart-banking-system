export default function LoadingSpinner({
  message = "Loading...",
}) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center">

      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />

      <p className="text-sm text-slate-500 mt-4">
        {message}
      </p>

    </div>
  );
}