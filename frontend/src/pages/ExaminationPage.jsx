import { useEffect, useState } from 'react';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { REGISTRATION_STATUS } from '../lib/constants';

const EMPTY_EXAM = {
  keluhan: '', tekanan_darah: '', suhu_tubuh: '', berat_badan: '', tinggi_badan: '',
  diagnosa: '', rencana_terapi: '',
};

export default function ExaminationPage() {
  const [regs, setRegs] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [examReg, setExamReg] = useState(null);
  const [exam, setExam] = useState(EMPTY_EXAM);
  const [actions, setActions] = useState([]);
  const [items, setItems] = useState([]);
  const [rxNote, setRxNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const [historyOf, setHistoryOf] = useState(null);
  const [history, setHistory] = useState(null);

  const load = () => api.get('/registrations').then((r) =>
    setRegs(r.data.data.items.filter((x) => x.status !== 'selesai')));

  useEffect(() => {
    Promise.all([load(), api.get('/medications').then((r) => setMedications(r.data.data.items))])
      .finally(() => setLoading(false));
  }, []);

  const openExam = (reg) => {
    setExamReg(reg); setExam(EMPTY_EXAM); setActions([]); setItems([]); setRxNote(''); setErr('');
  };

  const submitExam = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      await api.post('/medical-records', {
        registration_id: examReg.id,
        ...exam,
        suhu_tubuh: exam.suhu_tubuh || null,
        berat_badan: exam.berat_badan || null,
        tinggi_badan: exam.tinggi_badan || null,
        actions: actions.filter((a) => a.nama_tindakan),
        prescription: items.filter((i) => i.nama_obat).length
          ? { catatan: rxNote, items: items.filter((i) => i.nama_obat) }
          : null,
      });
      setExamReg(null);
      load();
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Gagal menyimpan pemeriksaan.');
    } finally { setSaving(false); }
  };

  const openHistory = async (reg) => {
    setHistoryOf(reg); setHistory(null);
    const { data } = await api.get(`/medical-records/${reg.patient_id}`);
    setHistory(data.data);
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Pemeriksaan" subtitle="Pemeriksaan pasien dengan metode SOAP" />

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50"><tr>
              <th className="th">Antrean</th><th className="th">Pasien</th><th className="th">Poli / Dokter</th>
              <th className="th">Keluhan</th><th className="th">Status</th><th className="th text-right">Aksi</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {regs.length === 0 && <tr><td colSpan={6} className="td py-8 text-center text-slate-400">Tidak ada pasien menunggu pemeriksaan.</td></tr>}
              {regs.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="td font-mono font-semibold text-brand-700">{r.queue_number || '—'}</td>
                  <td className="td"><div className="font-medium text-slate-800">{r.pasien_nama}</div><div className="text-xs text-slate-400">{r.no_rekam_medis}</div></td>
                  <td className="td">{r.poli_nama}<div className="text-xs text-slate-400">{r.dokter_nama}</div></td>
                  <td className="td max-w-xs truncate text-slate-500">{r.keluhan_awal || '-'}</td>
                  <td className="td"><StatusBadge map={REGISTRATION_STATUS} value={r.status} /></td>
                  <td className="td">
                    <div className="flex justify-end gap-1">
                      <button className="btn btn-ghost px-2 py-1 text-xs" onClick={() => openHistory(r)}>Riwayat</button>
                      <button className="btn btn-primary px-2 py-1 text-xs" onClick={() => openExam(r)}>Periksa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!examReg} onClose={() => setExamReg(null)} title={`Pemeriksaan — ${examReg?.pasien_nama || ''}`} size="xl">
        {examReg && (
          <form onSubmit={submitExam} className="space-y-5">
            {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

            <Section letter="S" title="Subjective">
              <label className="label">Keluhan Pasien</label>
              <textarea className="input" rows={2} value={exam.keluhan} onChange={(e) => setExam({ ...exam, keluhan: e.target.value })} />
            </Section>

            <Section letter="O" title="Objective">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div><label className="label">Tek. Darah</label><input className="input" placeholder="120/80" value={exam.tekanan_darah} onChange={(e) => setExam({ ...exam, tekanan_darah: e.target.value })} /></div>
                <div><label className="label">Suhu (°C)</label><input className="input" type="number" step="0.1" value={exam.suhu_tubuh} onChange={(e) => setExam({ ...exam, suhu_tubuh: e.target.value })} /></div>
                <div><label className="label">Berat (kg)</label><input className="input" type="number" step="0.1" value={exam.berat_badan} onChange={(e) => setExam({ ...exam, berat_badan: e.target.value })} /></div>
                <div><label className="label">Tinggi (cm)</label><input className="input" type="number" step="0.1" value={exam.tinggi_badan} onChange={(e) => setExam({ ...exam, tinggi_badan: e.target.value })} /></div>
              </div>
            </Section>

            <Section letter="A" title="Assessment">
              <label className="label">Diagnosa</label>
              <textarea className="input" rows={2} value={exam.diagnosa} onChange={(e) => setExam({ ...exam, diagnosa: e.target.value })} />
            </Section>

            <Section letter="P" title="Plan">
              <label className="label">Rencana Terapi</label>
              <textarea className="input" rows={2} value={exam.rencana_terapi} onChange={(e) => setExam({ ...exam, rencana_terapi: e.target.value })} />
            </Section>

            <div className="rounded-lg border border-slate-200 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-700">Tindakan Medis</h4>
                <button type="button" className="btn btn-secondary px-2 py-1 text-xs" onClick={() => setActions([...actions, { nama_tindakan: '', biaya: '' }])}>+ Tambah</button>
              </div>
              {actions.length === 0 && <p className="text-xs text-slate-400">Belum ada tindakan.</p>}
              {actions.map((a, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <input className="input flex-1" placeholder="Nama tindakan" value={a.nama_tindakan} onChange={(e) => upd(actions, setActions, i, 'nama_tindakan', e.target.value)} />
                  <input className="input w-32" type="number" placeholder="Biaya" value={a.biaya} onChange={(e) => upd(actions, setActions, i, 'biaya', e.target.value)} />
                  <button type="button" className="btn btn-ghost px-2 text-red-600" onClick={() => setActions(actions.filter((_, x) => x !== i))}>✕</button>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-700">Resep Obat</h4>
                <button type="button" className="btn btn-secondary px-2 py-1 text-xs" onClick={() => setItems([...items, { medication_id: '', nama_obat: '', dosis: '', jumlah: 1, aturan_pakai: '' }])}>+ Tambah</button>
              </div>
              {items.length === 0 && <p className="text-xs text-slate-400">Belum ada obat.</p>}
              {items.map((it, i) => (
                <div key={i} className="mb-2 grid grid-cols-12 gap-2">
                  <select className="input col-span-4" value={it.medication_id}
                    onChange={(e) => {
                      const med = medications.find((m) => String(m.id) === e.target.value);
                      const next = [...items];
                      next[i] = { ...next[i], medication_id: e.target.value, nama_obat: med ? med.nama_obat : '' };
                      setItems(next);
                    }}>
                    <option value="">Pilih obat…</option>
                    {medications.map((m) => <option key={m.id} value={m.id}>{m.nama_obat}</option>)}
                  </select>
                  <input className="input col-span-2" placeholder="Dosis" value={it.dosis} onChange={(e) => upd(items, setItems, i, 'dosis', e.target.value)} />
                  <input className="input col-span-2" type="number" min="1" placeholder="Jml" value={it.jumlah} onChange={(e) => upd(items, setItems, i, 'jumlah', e.target.value)} />
                  <input className="input col-span-3" placeholder="Aturan pakai" value={it.aturan_pakai} onChange={(e) => upd(items, setItems, i, 'aturan_pakai', e.target.value)} />
                  <button type="button" className="btn btn-ghost col-span-1 px-2 text-red-600" onClick={() => setItems(items.filter((_, x) => x !== i))}>✕</button>
                </div>
              ))}
              {items.length > 0 && <input className="input mt-2" placeholder="Catatan resep (opsional)" value={rxNote} onChange={(e) => setRxNote(e.target.value)} />}
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" className="btn btn-secondary" onClick={() => setExamReg(null)}>Batal</button>
              <button className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan Pemeriksaan'}</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!historyOf} onClose={() => setHistoryOf(null)} title={`Riwayat — ${historyOf?.pasien_nama || ''}`} size="lg">
        {!history ? <Spinner /> : history.records.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada riwayat pemeriksaan untuk pasien ini.</p>
        ) : (
          <div className="space-y-4">
            {history.records.map((rec) => (
              <div key={rec.id} className="rounded-lg border border-slate-200 p-4">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium text-slate-800">{rec.tanggal_kunjungan?.slice(0, 10)} · {rec.poli_nama}</span>
                  <span className="text-slate-400">{rec.dokter_nama}</span>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <Info k="Keluhan (S)" v={rec.keluhan} />
                  <Info k="Vital (O)" v={[rec.tekanan_darah && `TD ${rec.tekanan_darah}`, rec.suhu_tubuh && `${rec.suhu_tubuh}°C`].filter(Boolean).join(' · ')} />
                  <Info k="Diagnosa (A)" v={rec.diagnosa} />
                  <Info k="Terapi (P)" v={rec.rencana_terapi} />
                </dl>
                {rec.prescription?.items?.length > 0 && (
                  <div className="mt-2 border-t border-slate-100 pt-2">
                    <p className="mb-1 text-xs font-semibold text-slate-500">Resep</p>
                    <ul className="text-sm text-slate-700">
                      {rec.prescription.items.map((it) => <li key={it.id}>• {it.nama_obat} — {it.jumlah}, {it.aturan_pakai}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

function upd(arr, setArr, i, key, val) {
  const next = [...arr];
  next[i] = { ...next[i], [key]: val };
  setArr(next);
}
function Section({ letter, title, children }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-brand-600 text-xs font-bold text-white">{letter}</span>
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
      </div>
      {children}
    </div>
  );
}
function Info({ k, v }) {
  return <div><dt className="text-xs text-slate-400">{k}</dt><dd className="text-slate-700">{v || '-'}</dd></div>;
}
