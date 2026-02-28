const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authenticate = require('../middleware/auth');

router.post('/initiate', authenticate, paymentController.initiatePayment);
router.post('/webhook', paymentController.paymentWebhook);

module.exports = router;