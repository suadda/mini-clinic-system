const router = require('express').Router();
const c = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', c.stats);

module.exports = router;
