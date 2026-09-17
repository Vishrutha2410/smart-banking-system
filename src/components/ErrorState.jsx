const ErrorState = ({ message = "Unable to load data. Please try again.", onRetry }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50 py-10 text-center">
    <p className="font-medium text-red-600">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
      >
        Retry
      </button>
    )}
  </div>
);

export default ErrorState;
