require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const responseFormatter = require('./middleware/response');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { pool } = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));
app.use(responseFormatter);

app.get('/', (req, res) =>
  res.sendSuccess({ name: 'Mini Clinic Information System API', version: '1.0.0' }, 'API is running'));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('Database connected');
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
})();
