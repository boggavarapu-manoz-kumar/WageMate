const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');

// const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Route: /api/dashboard
router.route('/').get(getDashboardStats);

module.exports = router;
