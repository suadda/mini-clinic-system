const router = require('express').Router();
const c = require('../controllers/queueController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', c.list);
router.post('/', authorize('administrator', 'petugas'), c.create);
router.put('/:id/call', authorize('administrator', 'petugas', 'dokter'), c.call);
router.put('/:id/status', authorize('administrator', 'petugas', 'dokter'), c.updateStatus);

module.exports = router;
