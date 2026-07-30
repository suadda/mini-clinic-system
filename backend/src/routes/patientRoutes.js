const router = require('express').Router();
const c = require('../controllers/patientController');
const validate = require('../middleware/validate');
const { createRules, updateRules } = require('../validators/patientValidator');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', c.list);
router.get('/:id', c.detail);
router.post('/', authorize('administrator', 'petugas'), createRules, validate, c.create);
router.put('/:id', authorize('administrator', 'petugas'), updateRules, validate, c.update);
router.delete('/:id', authorize('administrator', 'petugas'), c.remove);

module.exports = router;
