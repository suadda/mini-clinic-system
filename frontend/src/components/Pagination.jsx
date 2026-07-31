export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
      <span>Halaman {page} dari {totalPages}</span>
      <div className="flex gap-2">
        <button className="btn btn-secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>Sebelumnya</button>
        <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Berikutnya</button>
      </div>
    </div>
  );
}
