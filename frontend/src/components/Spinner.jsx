export default function Spinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
    </div>
  );
}
