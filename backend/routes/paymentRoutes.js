const express = require('express');
const router = express.Router();

const { createCheckoutSession, verifyPayment } = require('../controllers/paymentController');
const { auth, managerOnly } = require('../middleware/auth');

// 🔥 NEW ROUTE (IMPORTANT)
router.post('/create-checkout-session', auth, managerOnly, createCheckoutSession);

// Keep this
router.post('/verify', auth, managerOnly, verifyPayment);

module.exports = router;