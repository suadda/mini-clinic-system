const router = require('express').Router();
const c = require('../controllers/masterController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/poli', c.listPoli);
router.get('/doctors', c.listDoctors);
router.get('/medications', c.listMedications);

module.exports = router;
