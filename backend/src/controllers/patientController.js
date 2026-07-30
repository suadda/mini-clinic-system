const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// GET /patients?page=&limit=&search=
exports.list = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  const offset = (page - 1) * limit;
  const search = (req.query.search || '').trim();

  const params = [];
  let where = '';
  if (search) {
    params.push(`%${search}%`);
    where = 'WHERE nama ILIKE $1 OR nik ILIKE $1 OR no_rekam_medis ILIKE $1';
  }

  const totalRes = await db.query(`SELECT COUNT(*) FROM patients ${where}`, params);
  const total = parseInt(totalRes.rows[0].count);

  const { rows } = await db.query(
    `SELECT * FROM patients ${where} ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  res.sendSuccess(
    { items: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } },
    'Success'
  );
});

exports.detail = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM patients WHERE id = $1', [req.params.id]);
  if (!rows[0]) throw new ApiError(404, 'Pasien tidak ditemukan');
  res.sendSuccess(rows[0], 'Success');
});

exports.create = asyncHandler(async (req, res) => {
  const { nik, nama, jenis_kelamin, tanggal_lahir, no_telepon, alamat } = req.body;
  const { rows } = await db.query(
    `INSERT INTO patients (nik, nama, jenis_kelamin, tanggal_lahir, no_telepon, alamat)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [nik, nama, jenis_kelamin, tanggal_lahir, no_telepon || null, alamat || null]
  );
  res.sendSuccess(rows[0], 'Pasien berhasil ditambahkan', 201);
});

exports.update = asyncHandler(async (req, res) => {
  const { nik, nama, jenis_kelamin, tanggal_lahir, no_telepon, alamat } = req.body;
  const { rows } = await db.query(
    `UPDATE patients SET nik=$1, nama=$2, jenis_kelamin=$3, tanggal_lahir=$4, no_telepon=$5, alamat=$6
     WHERE id=$7 RETURNING *`,
    [nik, nama, jenis_kelamin, tanggal_lahir, no_telepon || null, alamat || null, req.params.id]
  );
  if (!rows[0]) throw new ApiError(404, 'Pasien tidak ditemukan');
  res.sendSuccess(rows[0], 'Pasien berhasil diperbarui');
});

exports.remove = asyncHandler(async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM patients WHERE id = $1', [req.params.id]);
  if (!rowCount) throw new ApiError(404, 'Pasien tidak ditemukan');
  res.sendSuccess({}, 'Pasien berhasil dihapus');
});
