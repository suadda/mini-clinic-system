const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// POST /prescriptions  { medical_record_id, catatan?, items:[{medication_id?, nama_obat, dosis?, jumlah?, aturan_pakai?}] }
exports.create = asyncHandler(async (req, res) => {
  const { medical_record_id, catatan, items } = req.body;
  if (!medical_record_id)
    throw new ApiError(422, 'Validation Error', { medical_record_id: 'Medical record wajib diisi' });
  if (!Array.isArray(items) || items.length === 0)
    throw new ApiError(422, 'Validation Error', { items: 'Minimal satu item obat' });

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const mr = await client.query('SELECT id FROM medical_records WHERE id = $1', [medical_record_id]);
    if (!mr.rows[0]) throw new ApiError(404, 'Rekam medis tidak ditemukan');

    const pRes = await client.query(
      'INSERT INTO prescriptions (medical_record_id, catatan) VALUES ($1,$2) RETURNING *',
      [medical_record_id, catatan || null]
    );
    const presc = pRes.rows[0];

    const saved = [];
    for (const it of items) {
      if (!it.nama_obat)
        throw new ApiError(422, 'Validation Error', { items: 'nama_obat wajib diisi pada setiap item' });
      const r = await client.query(
        `INSERT INTO prescription_items
          (prescription_id, medication_id, nama_obat, dosis, jumlah, aturan_pakai)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [presc.id, it.medication_id || null, it.nama_obat, it.dosis || null, it.jumlah || 1, it.aturan_pakai || null]
      );
      saved.push(r.rows[0]);
    }

    await client.query('COMMIT');
    res.sendSuccess({ ...presc, items: saved }, 'Resep berhasil dibuat', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// GET /prescriptions/:id
exports.detail = asyncHandler(async (req, res) => {
  const pRes = await db.query(
    `SELECT pr.*, mr.patient_id, p.nama AS pasien_nama, p.no_rekam_medis, d.nama AS dokter_nama
     FROM prescriptions pr
     JOIN medical_records mr ON mr.id = pr.medical_record_id
     JOIN patients p ON p.id = mr.patient_id
     JOIN doctors  d ON d.id = mr.doctor_id
     WHERE pr.id = $1`,
    [req.params.id]
  );
  if (!pRes.rows[0]) throw new ApiError(404, 'Resep tidak ditemukan');
  const items = await db.query('SELECT * FROM prescription_items WHERE prescription_id = $1', [req.params.id]);
  res.sendSuccess({ ...pRes.rows[0], items: items.rows }, 'Success');
});
