const { body } = require('express-validator');

exports.createRules = [
  body('patient_id').isInt().withMessage('Pasien wajib dipilih'),
  body('doctor_id').isInt().withMessage('Dokter wajib dipilih'),
  body('poli_id').isInt().withMessage('Poli wajib dipilih'),
  body('tanggal_kunjungan').optional({ nullable: true }).isISO8601().withMessage('Tanggal kunjungan tidak valid'),
  body('jenis_pembayaran').optional({ nullable: true }).isIn(['umum', 'bpjs', 'asuransi']).withMessage('Jenis pembayaran tidak valid'),
  body('keluhan_awal').optional({ nullable: true }).isString(),
];

exports.updateRules = [
  body('status').optional().isIn(['menunggu', 'check_in', 'pemeriksaan', 'selesai']).withMessage('Status tidak valid'),
  body('jenis_pembayaran').optional().isIn(['umum', 'bpjs', 'asuransi']).withMessage('Jenis pembayaran tidak valid'),
  body('keluhan_awal').optional({ nullable: true }).isString(),
];
