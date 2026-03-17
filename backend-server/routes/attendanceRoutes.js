const express = require('express');
const {
    markAttendance,
    getWorkerAttendance,
    getSiteAttendance
} = require('../controllers/attendanceController');

// In a real application, you would import auth middleware here:
// const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Route: /api/attendance
router
    .route('/')
    .post(markAttendance); // POST /api/attendance

// Route: /api/attendance/:workerId  (Get history for a specific worker)
router
    .route('/:workerId')
    .get(getWorkerAttendance);

// Route: /api/attendance/site/:siteId (Get attendance list for a site on a specific date)
router
    .route('/site/:siteId')
    .get(getSiteAttendance);

module.exports = router;
