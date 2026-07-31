export default function StatusBadge({ map, value }) {
  const s = map[value] || { label: value, cls: 'bg-slate-100 text-slate-600' };
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}
