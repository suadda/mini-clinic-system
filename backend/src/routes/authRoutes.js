const router = require('express').Router();
const { login, logout, me } = require('../controllers/authController');
const validate = require('../middleware/validate');
const { loginRules } = require('../validators/authValidator');
const { authenticate } = require('../middleware/auth');

router.post('/login', loginRules, validate, login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

module.exports = router;
