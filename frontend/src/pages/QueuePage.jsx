import { useEffect, useState } from 'react';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import { QUEUE_STATUS } from '../lib/constants';

export default function QueuePage() {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/queues').then((r) => setQueues(r.data.data.items)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const call = async (q) => { await api.put(`/queues/${q.id}/call`); load(); };
  const setStatus = async (q, status) => { await api.put(`/queues/${q.id}/status`, { status }); load(); };

  if (loading) return <Spinner />;

  const waiting = queues.filter((q) => q.status === 'menunggu');
  const current = queues.find((q) => q.status === 'dipanggil' || q.status === 'dilayani');

  return (
    <div>
      <PageHeader title="Antrean" subtitle="Antrean pasien hari ini" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-sm text-slate-500">Sedang dilayani</p>
          <p className="mt-1 text-4xl font-bold text-brand-700">{current ? current.queue_number : '—'}</p>
          {current && <p className="mt-1 text-sm text-slate-500">{current.pasien_nama} · {current.poli_nama}</p>}
        </div>
        <div className="card flex flex-col justify-center p-5">
          <p className="text-sm text-slate-500">Menunggu</p>
          <p className="mt-1 text-4xl font-bold text-amber-600">{waiting.length}</p>
        </div>
      </div>

      <div className="card">
        <div className="border-b border-slate-200 px-5 py-3"><h2 className="font-semibold text-slate-800">Daftar Antrean</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50"><tr>
              <th className="th">No</th><th className="th">Pasien</th><th className="th">Poli</th>
              <th className="th">Status</th><th className="th text-right">Aksi</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {queues.length === 0 && <tr><td colSpan={5} className="td py-8 text-center text-slate-400">Belum ada antrean hari ini.</td></tr>}
              {queues.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50">
                  <td className="td font-mono text-lg font-bold text-brand-700">{q.queue_number}</td>
                  <td className="td"><div className="font-medium text-slate-800">{q.pasien_nama}</div><div className="text-xs text-slate-400">{q.no_rekam_medis}</div></td>
                  <td className="td">{q.poli_nama}</td>
                  <td className="td"><StatusBadge map={QUEUE_STATUS} value={q.status} /></td>
                  <td className="td">
                    <div className="flex justify-end gap-1">
                      {q.status === 'menunggu' && <button className="btn btn-primary px-2 py-1 text-xs" onClick={() => call(q)}>Panggil</button>}
                      {q.status === 'dipanggil' && <button className="btn btn-secondary px-2 py-1 text-xs" onClick={() => setStatus(q, 'dilayani')}>Layani</button>}
                      {(q.status === 'dipanggil' || q.status === 'dilayani') && <button className="btn btn-secondary px-2 py-1 text-xs" onClick={() => setStatus(q, 'selesai')}>Selesai</button>}
                      {q.status === 'menunggu' && <button className="btn btn-ghost px-2 py-1 text-xs" onClick={() => setStatus(q, 'dilewati')}>Lewati</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
