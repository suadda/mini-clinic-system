import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';

const EMPTY = { nik: '', nama: '', jenis_kelamin: 'L', tanggal_lahir: '', no_telepon: '', alamat: '' };

export default function PatientsPage() {
  const [data, setData] = useState({ items: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/patients', { params: { page, limit: 8, search } });
      setData(data.data);
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const onSearch = (v) => { setSearch(v); setPage(1); };

  const openCreate = () => { setEditing(null); setForm(EMPTY); setErrors({}); setFormOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      nik: p.nik, nama: p.nama, jenis_kelamin: p.jenis_kelamin,
      tanggal_lahir: p.tanggal_lahir?.slice(0, 10) || '',
      no_telepon: p.no_telepon || '', alamat: p.alamat || '',
    });
    setErrors({}); setFormOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setErrors({});
    try {
      if (editing) await api.put(`/patients/${editing.id}`, form);
      else await api.post('/patients', form);
      setFormOpen(false);
      load();
    } catch (err) {
      const res = err.response?.data;
      if (res?.errors && Object.keys(res.errors).length) setErrors(res.errors);
      else setErrors({ _global: res?.message || 'Gagal menyimpan data' });
    } finally { setSaving(false); }
  };

  const remove = async (p) => {
    if (!window.confirm(`Hapus pasien ${p.nama}?`)) return;
    try { await api.delete(`/patients/${p.id}`); load(); }
    catch (err) { window.alert(err.response?.data?.message || 'Gagal menghapus'); }
  };

  return (
    <div>
      <PageHeader title="Data Pasien" subtitle="Kelola data master pasien klinik"
        action={<button className="btn btn-primary" onClick={openCreate}>+ Tambah Pasien</button>} />

      <div className="card">
        <div className="border-b border-slate-200 p-4">
          <input className="input max-w-sm" placeholder="Cari nama, NIK, atau no. rekam medis…"
            value={search} onChange={(e) => onSearch(e.target.value)} />
        </div>

        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">No. RM</th><th className="th">NIK</th><th className="th">Nama</th>
                  <th className="th">JK</th><th className="th">Tgl Lahir</th><th className="th">Telepon</th>
                  <th className="th text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.length === 0 && (
                  <tr><td className="td py-8 text-center text-slate-400" colSpan={7}>Belum ada data pasien. Tambahkan pasien baru untuk memulai.</td></tr>
                )}
                {data.items.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="td font-mono font-medium text-brand-700">{p.no_rekam_medis}</td>
                    <td className="td">{p.nik}</td>
                    <td className="td font-medium text-slate-800">{p.nama}</td>
                    <td className="td">{p.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                    <td className="td">{p.tanggal_lahir?.slice(0, 10)}</td>
                    <td className="td">{p.no_telepon || '-'}</td>
                    <td className="td">
                      <div className="flex justify-end gap-1">
                        <button className="btn btn-ghost px-2 py-1 text-xs" onClick={() => setDetail(p)}>Detail</button>
                        <button className="btn btn-ghost px-2 py-1 text-xs" onClick={() => openEdit(p)}>Ubah</button>
                        <button className="btn px-2 py-1 text-xs text-red-600 hover:bg-red-50" onClick={() => remove(p)}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />
          </div>
        )}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Ubah Data Pasien' : 'Tambah Pasien'}>
        <form onSubmit={save} className="space-y-4">
          {errors._global && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors._global}</div>}
          <Field label="NIK" error={errors.nik}>
            <input className="input" value={form.nik} maxLength={16}
              onChange={(e) => setForm({ ...form, nik: e.target.value.replace(/\D/g, '') })} placeholder="16 digit angka" />
          </Field>
          <Field label="Nama Lengkap" error={errors.nama}>
            <input className="input" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Jenis Kelamin" error={errors.jenis_kelamin}>
              <select className="input" value={form.jenis_kelamin} onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })}>
                <option value="L">Laki-laki</option><option value="P">Perempuan</option>
              </select>
            </Field>
            <Field label="Tanggal Lahir" error={errors.tanggal_lahir}>
              <input type="date" className="input" value={form.tanggal_lahir} onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })} />
            </Field>
          </div>
          <Field label="No. Telepon" error={errors.no_telepon}>
            <input className="input" value={form.no_telepon} onChange={(e) => setForm({ ...form, no_telepon: e.target.value })} />
          </Field>
          <Field label="Alamat" error={errors.alamat}>
            <textarea className="input" rows={2} value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>Batal</button>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detail Pasien">
        {detail && (
          <dl className="space-y-3 text-sm">
            <Row k="No. Rekam Medis" v={detail.no_rekam_medis} />
            <Row k="NIK" v={detail.nik} />
            <Row k="Nama" v={detail.nama} />
            <Row k="Jenis Kelamin" v={detail.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} />
            <Row k="Tanggal Lahir" v={detail.tanggal_lahir?.slice(0, 10)} />
            <Row k="No. Telepon" v={detail.no_telepon || '-'} />
            <Row k="Alamat" v={detail.alamat || '-'} />
          </dl>
        )}
      </Modal>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
function Row({ k, v }) {
  return (
    <div className="flex justify-between border-b border-slate-100 pb-2">
      <dt className="text-slate-500">{k}</dt><dd className="font-medium text-slate-800">{v}</dd>
    </div>
  );
}
