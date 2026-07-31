const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// Read-only master data used to populate dropdowns in the UI.
exports.listPoli = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM poli ORDER BY nama');
  res.sendSuccess({ items: rows }, 'Success');
});

exports.listDoctors = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT d.id, d.nama, d.spesialisasi, d.poli_id, pl.nama AS poli_nama
     FROM doctors d LEFT JOIN poli pl ON pl.id = d.poli_id
     ORDER BY d.nama`
  );
  res.sendSuccess({ items: rows }, 'Success');
});

exports.listMedications = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM medications ORDER BY nama_obat');
  res.sendSuccess({ items: rows }, 'Success');
});
