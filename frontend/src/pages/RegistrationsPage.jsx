import { useEffect, useState } from 'react';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import { REGISTRATION_STATUS, PAYMENT_TYPES } from '../lib/constants';

export default function RegistrationsPage() {
  const [regs, setRegs] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [poli, setPoli] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ patient_id: '', poli_id: '', doctor_id: '', tanggal_kunjungan: today, jenis_pembayaran: 'umum', keluhan_awal: '' });

  const loadRegs = () => api.get('/registrations').then((r) => setRegs(r.data.data.items));

  useEffect(() => {
    Promise.all([
      loadRegs(),
      api.get('/patients', { params: { limit: 100 } }).then((r) => setPatients(r.data.data.items)),
      api.get('/doctors').then((r) => setDoctors(r.data.data.items)),
      api.get('/poli').then((r) => setPoli(r.data.data.items)),
    ]).finally(() => setLoading(false));
  }, []);

  const doctorsForPoli = form.poli_id ? doctors.filter((d) => String(d.poli_id) === String(form.poli_id)) : doctors;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      await api.post('/registrations', {
        patient_id: Number(form.patient_id),
        doctor_id: Number(form.doctor_id),
        poli_id: Number(form.poli_id),
        tanggal_kunjungan: form.tanggal_kunjungan,
        jenis_pembayaran: form.jenis_pembayaran,
        keluhan_awal: form.keluhan_awal,
      });
      setForm({ ...form, patient_id: '', doctor_id: '', keluhan_awal: '' });
      setMsg({ type: 'ok', text: 'Pendaftaran berhasil dibuat.' });
      loadRegs();
    } catch (err) {
      setMsg({ type: 'err', text: err.response?.data?.message || 'Gagal membuat pendaftaran.' });
    } finally { setSaving(false); }
  };

  const makeQueue = async (reg) => {
    try { await api.post('/queues', { registration_id: reg.id }); loadRegs(); }
    catch (err) { window.alert(err.response?.data?.message || 'Gagal membuat antrean'); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Pendaftaran" subtitle="Daftarkan kunjungan pasien ke poli tujuan" />
      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={submit} className="card space-y-4 p-5 lg:col-span-1">
          <h2 className="font-semibold text-slate-800">Pendaftaran Baru</h2>
          {msg && <div className={`rounded-lg px-3 py-2 text-sm ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</div>}
          <div>
            <label className="label">Pasien</label>
            <select className="input" required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
              <option value="">Pilih pasien…</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.nama} — {p.no_rekam_medis}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Poli</label>
            <select className="input" required value={form.poli_id} onChange={(e) => setForm({ ...form, poli_id: e.target.value, doctor_id: '' })}>
              <option value="">Pilih poli…</option>
              {poli.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Dokter</label>
            <select className="input" required value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}>
              <option value="">Pilih dokter…</option>
              {doctorsForPoli.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tanggal</label>
              <input type="date" className="input" value={form.tanggal_kunjungan} onChange={(e) => setForm({ ...form, tanggal_kunjungan: e.target.value })} />
            </div>
            <div>
              <label className="label">Pembayaran</label>
              <select className="input" value={form.jenis_pembayaran} onChange={(e) => setForm({ ...form, jenis_pembayaran: e.target.value })}>
                {PAYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Keluhan Awal</label>
            <textarea className="input" rows={2} value={form.keluhan_awal} onChange={(e) => setForm({ ...form, keluhan_awal: e.target.value })} />
          </div>
          <button className="btn btn-primary w-full" disabled={saving}>{saving ? 'Menyimpan…' : 'Daftarkan'}</button>
        </form>

        <div className="card lg:col-span-2">
          <div className="border-b border-slate-200 px-5 py-3"><h2 className="font-semibold text-slate-800">Daftar Kunjungan</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50"><tr>
                <th className="th">Antrean</th><th className="th">Pasien</th><th className="th">Poli / Dokter</th>
                <th className="th">Bayar</th><th className="th">Status</th><th className="th text-right">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {regs.length === 0 && <tr><td colSpan={6} className="td py-8 text-center text-slate-400">Belum ada pendaftaran.</td></tr>}
                {regs.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="td font-mono font-semibold text-brand-700">{r.queue_number || '—'}</td>
                    <td className="td"><div className="font-medium text-slate-800">{r.pasien_nama}</div><div className="text-xs text-slate-400">{r.no_rekam_medis}</div></td>
                    <td className="td">{r.poli_nama}<div className="text-xs text-slate-400">{r.dokter_nama}</div></td>
                    <td className="td text-xs uppercase">{r.jenis_pembayaran}</td>
                    <td className="td"><StatusBadge map={REGISTRATION_STATUS} value={r.status} /></td>
                    <td className="td text-right">
                      {!r.queue_number
                        ? <button className="btn btn-secondary px-2 py-1 text-xs" onClick={() => makeQueue(r)}>Buat Antrean</button>
                        : <span className="text-xs text-slate-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
