const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const BASE_SELECT = `
  SELECT r.*, p.nama AS pasien_nama, p.no_rekam_medis,
         d.nama AS dokter_nama, pl.nama AS poli_nama, pl.kode AS poli_kode,
         q.queue_number, q.status AS queue_status
  FROM registrations r
  JOIN patients p ON p.id = r.patient_id
  JOIN doctors  d ON d.id = r.doctor_id
  JOIN poli     pl ON pl.id = r.poli_id
  LEFT JOIN queues q ON q.registration_id = r.id`;

// GET /registrations?date=&status=
exports.list = asyncHandler(async (req, res) => {
  const { date, status } = req.query;
  const params = [];
  const cond = [];
  if (date)   { params.push(date);   cond.push(`r.tanggal_kunjungan = $${params.length}`); }
  if (status) { params.push(status); cond.push(`r.status = $${params.length}`); }
  const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';
  const { rows } = await db.query(`${BASE_SELECT} ${where} ORDER BY r.id DESC`, params);
  res.sendSuccess({ items: rows }, 'Success');
});

exports.create = asyncHandler(async (req, res) => {
  const { patient_id, doctor_id, poli_id, tanggal_kunjungan, jenis_pembayaran, keluhan_awal } = req.body;
  const { rows } = await db.query(
    `INSERT INTO registrations
       (patient_id, doctor_id, poli_id, tanggal_kunjungan, jenis_pembayaran, keluhan_awal, created_by)
     VALUES ($1,$2,$3,COALESCE($4::date, CURRENT_DATE),$5,$6,$7)
     RETURNING *`,
    [patient_id, doctor_id, poli_id, tanggal_kunjungan || null, jenis_pembayaran || 'umum',
     keluhan_awal || null, req.user.id]
  );
  res.sendSuccess(rows[0], 'Pendaftaran berhasil dibuat', 201);
});

exports.update = asyncHandler(async (req, res) => {
  const { status, jenis_pembayaran, keluhan_awal } = req.body;
  const { rows } = await db.query(
    `UPDATE registrations SET
       status           = COALESCE($1, status),
       jenis_pembayaran = COALESCE($2, jenis_pembayaran),
       keluhan_awal     = COALESCE($3, keluhan_awal)
     WHERE id = $4 RETURNING *`,
    [status || null, jenis_pembayaran || null, keluhan_awal || null, req.params.id]
  );
  if (!rows[0]) throw new ApiError(404, 'Pendaftaran tidak ditemukan');
  res.sendSuccess(rows[0], 'Pendaftaran berhasil diperbarui');
});
