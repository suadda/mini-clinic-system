const { body } = require('express-validator');

const rules = [
  body('nik').trim().matches(/^[0-9]{16}$/).withMessage('NIK harus 16 digit angka'),
  body('nama').trim().notEmpty().withMessage('Nama wajib diisi'),
  body('jenis_kelamin').isIn(['L', 'P']).withMessage('Jenis kelamin harus L atau P'),
  body('tanggal_lahir').isISO8601().withMessage('Tanggal lahir tidak valid (format YYYY-MM-DD)'),
  body('no_telepon').optional({ nullable: true }).isString(),
  body('alamat').optional({ nullable: true }).isString(),
];

exports.createRules = rules;
exports.updateRules = rules;
