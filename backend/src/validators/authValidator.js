const { body } = require('express-validator');

exports.loginRules = [
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').notEmpty().withMessage('Password wajib diisi'),
];
