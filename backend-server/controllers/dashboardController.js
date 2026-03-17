const Worker = require('../models/Worker');
const Attendance = require('../models/Attendance');

// @desc    Get dashboard summary statistics
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        // 1. Total Active Workforce
        const totalWorkers = await Worker.countDocuments({ isActive: true });

        // Date calculations for filtering
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // Weekly range
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastWeekStr = lastWeek.toISOString().split('T')[0];

        // Monthly range
        const lastMonth = new Date();
        lastMonth.setDate(lastMonth.getDate() - 30);
        const lastMonthStr = lastMonth.toISOString().split('T')[0];

        // 2. Today's Attendance & Daily Burn
        const todaysAttendanceRecords = await Attendance.find({ date: todayStr });

        let todayPresentCount = 0;
        let todayCost = 0;

        todaysAttendanceRecords.forEach(record => {
            if (record.status === 'Present' || record.status === 'Half Day') {
                todayPresentCount++;
            }
            todayCost += (record.totalDaySalary || 0);
        });

        // 3. Weekly Liability (Last 7 days)
        const weeklyRecords = await Attendance.find({
            date: { $gte: lastWeekStr, $lte: todayStr }
        });
        const weeklyCost = weeklyRecords.reduce((acc, curr) => acc + (curr.totalDaySalary || 0), 0);

        // 4. Monthly Liability (Last 30 days)
        const monthlyRecords = await Attendance.find({
            date: { $gte: lastMonthStr, $lte: todayStr }
        });
        const monthlyCost = monthlyRecords.reduce((acc, curr) => acc + (curr.totalDaySalary || 0), 0);

        res.status(200).json({
            success: true,
            data: {
                totalWorkers,
                todayAttendance: {
                    present: todayPresentCount,
                    totalMarked: todaysAttendanceRecords.length
                },
                costs: {
                    today: Number(todayCost.toFixed(2)),
                    weekly: Number(weeklyCost.toFixed(2)),
                    monthly: Number(monthlyCost.toFixed(2))
                }
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to aggregate dashboard metrics' });
    }
};

module.exports = {
    getDashboardStats
};
