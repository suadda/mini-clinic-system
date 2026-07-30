const router = require('express').Router();
const c = require('../controllers/medicalRecordController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.post('/', authorize('administrator', 'dokter'), c.create);
router.get('/:patientId', c.historyByPatient);

module.exports = router;
