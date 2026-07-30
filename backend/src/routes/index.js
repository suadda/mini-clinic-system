const router = require('express').Router();

router.use('/', require('./authRoutes'));
router.use('/patients', require('./patientRoutes'));
router.use('/registrations', require('./registrationRoutes'));
router.use('/queues', require('./queueRoutes'));
router.use('/medical-records', require('./medicalRecordRoutes'));
router.use('/prescriptions', require('./prescriptionRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));

module.exports = router;
