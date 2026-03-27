const { calculateAggregateSalary } = require('../utils/salaryCalculator');
const Payment = require('../models/Payment');
const Worker = require('../models/Worker');
const Attendance = require('../models/Attendance');

// @desc    Generate salary calculation for a period
// @route   GET /api/payments/generate/:workerId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private (Admin)
const generateSalary = async (req, res) => {
    try {
        const { workerId } = req.params;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, error: 'Please provide startDate and endDate' });
        }

        // 1. Validate worker exists
        const worker = await Worker.findById(workerId);
        if (!worker) {
            return res.status(404).json({ success: false, error: 'Worker not found' });
        }

        // 2. Fetch all attendance records for this period
        // date is stored as YYYY-MM-DD string - string comparison works correctly for this format
        const attendanceRecords = await Attendance.find({
            workerId,
            date: {
                $gte: startDate,
                $lte: endDate
            }
        });

        if (attendanceRecords.length === 0) {
            return res.status(404).json({ success: false, error: 'No attendance records found for this period' });
        }

        // 2.5 Fetch existing payments to check settlement status
        const payments = await Payment.find({
            workerId,
            $or: [
                { periodStart: { $lte: endDate }, periodEnd: { $gte: startDate } }
            ]
        });

        // 3. Run Salary Calculation Engine
        const salaryData = calculateAggregateSalary(startDate, endDate, attendanceRecords, payments);

        res.status(200).json({
            success: true,
            worker: {
                id: worker._id,
                name: worker.name,
                salaryType: worker.salaryType,
                wageAmount: worker.wageAmount
            },
            period: { startDate, endDate },
            salaryData
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Record a payment distribution
// @route   POST /api/payments
// @access  Private (Admin)
const createPayment = async (req, res) => {
    try {
        const {
            workerId,
            amount,
            paymentMethod,
            periodStart,
            periodEnd,
            referenceId,
            notes
        } = req.body;

        const worker = await Worker.findById(workerId);
        if (!worker) {
            return res.status(404).json({ success: false, error: 'Worker not found' });
        }

        const payment = await Payment.create({
            workerId,
            amount,
            paymentMethod,
            periodStart,
            periodEnd,
            referenceId,
            notes, // Will need to update the model schema to include notes, but mongoose gracefully ignores extra fields by default if strict is true
            paidBy: "64a1b2c3d4e5f60012345678" // In a real app this is req.user.id
        });

        res.status(201).json({
            success: true,
            data: payment
        });

    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Get payment history for a specific worker
// @route   GET /api/payments/worker/:workerId
// @access  Private
const getWorkerPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ workerId: req.params.workerId })
            .sort({ date: -1 }) // Newest first
            .populate('paidBy', 'name');

        res.status(200).json({
            success: true,
            count: payments.length,
            data: payments
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get all payments across the company
// @route   GET /api/payments
// @access  Private (Admin)
const getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .sort({ date: -1 })
            .populate('workerId', 'name phone workType')
            .populate('paidBy', 'name');

        res.status(200).json({
            success: true,
            count: payments.length,
            data: payments
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

module.exports = {
    generateSalary,
    createPayment,
    getWorkerPayments,
    getAllPayments
};
