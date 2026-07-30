const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  if (!user || !user.is_active) throw new ApiError(401, 'Email atau password salah');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new ApiError(401, 'Email atau password salah');

  const payload = { id: user.id, name: user.name, role: user.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

  res.sendSuccess(
    { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    'Login berhasil'
  );
});

exports.logout = asyncHandler(async (req, res) => {
  // JWT is stateless: the client discards the token. Endpoint kept for symmetry.
  res.sendSuccess({}, 'Logout berhasil');
});

exports.me = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, name, email, role FROM users WHERE id = $1', [req.user.id]
  );
  res.sendSuccess(rows[0] || {}, 'Success');
});
