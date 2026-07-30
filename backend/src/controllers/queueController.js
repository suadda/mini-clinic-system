const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const BASE_SELECT = `
  SELECT q.*, r.status AS registration_status,
         p.nama AS pasien_nama, p.no_rekam_medis,
         pl.nama AS poli_nama, pl.kode AS poli_kode
  FROM queues q
  JOIN registrations r ON r.id = q.registration_id
  JOIN patients p ON p.id = r.patient_id
  JOIN poli     pl ON pl.id = q.poli_id`;

// GET /queues?date=&status=&poli_id=   (defaults to today)
exports.list = asyncHandler(async (req, res) => {
  const { date, status, poli_id } = req.query;
  const params = [];
  const cond = [];
  if (date) { params.push(date); cond.push(`q.queue_date = $${params.length}`); }
  else { cond.push('q.queue_date = CURRENT_DATE'); }
  if (status)  { params.push(status);  cond.push(`q.status = $${params.length}`); }
  if (poli_id) { params.push(poli_id); cond.push(`q.poli_id = $${params.length}`); }
  const { rows } = await db.query(
    `${BASE_SELECT} WHERE ${cond.join(' AND ')} ORDER BY q.queue_number ASC`, params
  );
  res.sendSuccess({ items: rows }, 'Success');
});

// POST /queues  { registration_id }  -> auto-generates number like A001
exports.create = asyncHandler(async (req, res) => {
  const { registration_id } = req.body;
  if (!registration_id)
    throw new ApiError(422, 'Validation Error', { registration_id: 'Registration wajib diisi' });

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const regRes = await client.query(
      'SELECT id, poli_id FROM registrations WHERE id = $1 FOR UPDATE', [registration_id]
    );
    const reg = regRes.rows[0];
    if (!reg) throw new ApiError(404, 'Pendaftaran tidak ditemukan');

    const dup = await client.query('SELECT id FROM queues WHERE registration_id = $1', [registration_id]);
    if (dup.rows[0]) throw new ApiError(409, 'Antrean untuk pendaftaran ini sudah dibuat');

    const poliRes = await client.query('SELECT kode FROM poli WHERE id = $1', [reg.poli_id]);
    const kode = poliRes.rows[0].kode;

    const seqRes = await client.query(
      'SELECT COUNT(*) AS c FROM queues WHERE poli_id = $1 AND queue_date = CURRENT_DATE', [reg.poli_id]
    );
    const queueNumber = `${kode}${String(parseInt(seqRes.rows[0].c) + 1).padStart(3, '0')}`;

    const ins = await client.query(
      `INSERT INTO queues (registration_id, poli_id, queue_number, queue_date, status)
       VALUES ($1,$2,$3,CURRENT_DATE,'menunggu') RETURNING *`,
      [registration_id, reg.poli_id, queueNumber]
    );

    await client.query('COMMIT');
    res.sendSuccess(ins.rows[0], 'Nomor antrean berhasil dibuat', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// PUT /queues/:id/call
exports.call = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `UPDATE queues SET status = 'dipanggil', called_at = NOW() WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  if (!rows[0]) throw new ApiError(404, 'Antrean tidak ditemukan');
  res.sendSuccess(rows[0], 'Antrean dipanggil');
});

// PUT /queues/:id/status  { status }
exports.updateStatus = asyncHandler(async (req, res) => {
  const allowed = ['menunggu', 'dipanggil', 'dilayani', 'selesai', 'dilewati'];
  const { status } = req.body;
  if (!allowed.includes(status))
    throw new ApiError(422, 'Validation Error', { status: 'Status antrean tidak valid' });
  const { rows } = await db.query('UPDATE queues SET status = $1 WHERE id = $2 RETURNING *',
    [status, req.params.id]);
  if (!rows[0]) throw new ApiError(404, 'Antrean tidak ditemukan');
  res.sendSuccess(rows[0], 'Status antrean diperbarui');
});
