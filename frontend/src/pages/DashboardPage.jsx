import { useEffect, useState } from 'react';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';

const CARDS = [
  { key: 'total_pasien', label: 'Total Pasien', accent: 'bg-brand-50 text-brand-700' },
  { key: 'pasien_hari_ini', label: 'Pasien Hari Ini', accent: 'bg-blue-50 text-blue-700' },
  { key: 'antrean_hari_ini', label: 'Antrean Hari Ini', accent: 'bg-violet-50 text-violet-700' },
  { key: 'pasien_menunggu', label: 'Menunggu', accent: 'bg-amber-50 text-amber-700' },
  { key: 'pasien_selesai', label: 'Selesai Dilayani', accent: 'bg-emerald-50 text-emerald-700' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then((r) => setStats(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Ringkasan aktivitas klinik hari ini" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {CARDS.map((c) => (
          <div key={c.key} className="card p-5">
            <div className={`mb-3 inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${c.accent}`}>{c.label}</div>
            <p className="text-3xl font-bold text-slate-800">{stats?.[c.key] ?? 0}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
