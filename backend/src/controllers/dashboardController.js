const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// GET /dashboard
exports.stats = asyncHandler(async (req, res) => {
  const { rows } = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM patients)                                                    AS total_pasien,
      (SELECT COUNT(*) FROM registrations WHERE tanggal_kunjungan = CURRENT_DATE)        AS pasien_hari_ini,
      (SELECT COUNT(*) FROM queues        WHERE queue_date        = CURRENT_DATE)        AS antrean_hari_ini,
      (SELECT COUNT(*) FROM registrations WHERE status = 'menunggu'
                                            AND tanggal_kunjungan = CURRENT_DATE)         AS pasien_menunggu,
      (SELECT COUNT(*) FROM registrations WHERE status = 'selesai'
                                            AND tanggal_kunjungan = CURRENT_DATE)         AS pasien_selesai
  `);
  const stats = rows[0];
  Object.keys(stats).forEach((k) => { stats[k] = parseInt(stats[k]); });
  res.sendSuccess(stats, 'Success');
});
