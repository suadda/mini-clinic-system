// 404 for unmatched routes.
const notFound = (req, res) =>
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} tidak ditemukan`,
    errors: {},
  });

// Centralized error handler. Maps common PostgreSQL errors to clean messages.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err.code === '23505') {
    return res.status(409).json({
      success: false, message: 'Data sudah ada (duplikat)', errors: { detail: err.detail },
    });
  }
  if (err.code === '23503') {
    return res.status(409).json({
      success: false,
      message: 'Data tidak dapat diproses karena masih terkait dengan data lain',
      errors: { detail: err.detail },
    });
  }
  if (err.code === '23514') {
    return res.status(422).json({
      success: false, message: 'Data tidak memenuhi aturan validasi', errors: { detail: err.detail },
    });
  }

  const status = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Terjadi kesalahan pada server';
  if (status >= 500) console.error(err);

  return res.status(status).json({ success: false, message, errors: err.errors || {} });
};

module.exports = { notFound, errorHandler };
