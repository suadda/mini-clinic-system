const router = require('express').Router();
const c = require('../controllers/prescriptionController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.post('/', authorize('administrator', 'dokter'), c.create);
router.get('/:id', c.detail);

module.exports = router;
