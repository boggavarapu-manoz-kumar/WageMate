const Attendance = require('../models/Attendance');
const Worker = require('../models/Worker');
const { calculateDailySalary } = require('../utils/salaryCalculator');

// @desc    Mark daily attendance
// @route   POST /api/attendance
// @access  Private
const markAttendance = async (req, res) => {
    try {
        const {
            workerId,
            siteId,
            date,
            status,
            overtimeHours,
            overtimeRate,
            extraBonus,
            customPayment,
            advancePaid,
            notes
        } = req.body;

        // 1. Validate worker exists
        const worker = await Worker.findById(workerId);
        if (!worker) {
            return res.status(404).json({ success: false, error: 'Worker not found' });
        }

        // 2. Prevent duplicate entries for the same date
        // date from the form is already in YYYY-MM-DD format (string), use it directly
        const normalizedDate = date; // already a YYYY-MM-DD string

        const existingRecord = await Attendance.findOne({
            workerId,
            date: normalizedDate
        });

        if (existingRecord) {
            return res.status(400).json({
                success: false,
                error: 'Attendance already marked for this worker on this date'
            });
        }

        // 3. Run Salary Calculation Engine
        const totalDaySalary = calculateDailySalary(worker, {
            status,
            overtimeHours,
            overtimeRate,
            extraBonus,
            customPayment,
            advancePaid
        });

        // 4. Save Attendance Record
        const attendance = await Attendance.create({
            workerId,
            siteId,
            date: normalizedDate,
            status,
            overtimeHours,
            overtimeRate,
            extraBonus,
            customPayment,
            advancePaid,
            totalDaySalary,
            notes,
            markedBy: "64a1b2c3d4e5f60012345678" // In real app: req.user.id
        });

        res.status(201).json({
            success: true,
            data: attendance
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, error: 'Duplicate attendance entry detected' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get attendance for a specific worker
// @route   GET /api/attendance/:workerId
// @access  Private
const getWorkerAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.find({ workerId: req.params.workerId })
            .sort({ date: -1 }) // Newest first
            .populate('siteId', 'siteName')
            .populate('markedBy', 'name');

        res.status(200).json({
            success: true,
            count: attendance.length,
            data: attendance
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get attendance by Site and Date (For the supervisor dashboard)
// @route   GET /api/attendance/site/:siteId?date=YYYY-MM-DD
// @access  Private
const getSiteAttendance = async (req, res) => {
    try {
        const { siteId } = req.params;
        const { date } = req.query;

        let query = { siteId };

        // If a specific date is requested
        if (date) {
            query.date = date; // date is already a YYYY-MM-DD string
        }

        const attendance = await Attendance.find(query)
            .populate('workerId', 'name phone wageAmount');

        res.status(200).json({
            success: true,
            count: attendance.length,
            data: attendance
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

module.exports = {
    markAttendance,
    getWorkerAttendance,
    getSiteAttendance
};
