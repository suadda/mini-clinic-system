const router = require('express').Router();
const c = require('../controllers/registrationController');
const validate = require('../middleware/validate');
const { createRules, updateRules } = require('../validators/registrationValidator');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', c.list);
router.post('/', authorize('administrator', 'petugas'), createRules, validate, c.create);
router.put('/:id', authorize('administrator', 'petugas'), updateRules, validate, c.update);

module.exports = router;
