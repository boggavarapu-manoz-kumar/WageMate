const express = require('express');
const {
    generateSalary,
    createPayment,
    getWorkerPayments,
    getAllPayments
} = require('../controllers/paymentController');

// const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Route: /api/payments
router
    .route('/')
    .get(getAllPayments)      // GET /api/payments
    .post(createPayment);     // POST /api/payments

// Route: /api/payments/generate/:workerId
router
    .route('/generate/:workerId')
    .get(generateSalary);     // GET /api/payments/generate/:workerId?startDate=X&endDate=Y

// Route: /api/payments/worker/:workerId
router
    .route('/worker/:workerId')
    .get(getWorkerPayments);  // GET /api/payments/worker/:workerId

module.exports = router;
