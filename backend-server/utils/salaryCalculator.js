/**
 * WageMate - Core Salary Calculation Engine
 * Handles daily, weekly, and monthly calculations with advances and overtime.
 */

/**
 * 1. Calculate Daily Salary
 * Used when marking daily attendance. Determines the exact value earned for one day.
 */
const calculateDailySalary = (worker, attendanceData) => {
    let baseEarnings = 0;

    console.log(`[SalaryEngine] Calculating for ${worker.name} | Status: ${attendanceData.status}`);

    // Calculate base earnings (Rule 1 & 2)
    if (attendanceData.status === 'Custom') {
        baseEarnings = 0;
    } else if (worker.salaryType === 'daily') {
        if (attendanceData.status === 'Present') baseEarnings = worker.wageAmount;
        if (attendanceData.status === 'Half Day') baseEarnings = worker.wageAmount / 2;
    }
    else if (worker.salaryType === 'monthly') {
        const dailyEquivalent = worker.wageAmount / 30; // Assuming 30 days in a month
        if (attendanceData.status === 'Present') baseEarnings = dailyEquivalent;
        if (attendanceData.status === 'Half Day') baseEarnings = dailyEquivalent / 2;
    }
    else if (worker.salaryType === 'weekly') {
        const dailyEquivalent = worker.wageAmount / 7; // Assuming 7 days in a week
        if (attendanceData.status === 'Present') baseEarnings = dailyEquivalent;
        if (attendanceData.status === 'Half Day') baseEarnings = dailyEquivalent / 2;
    }

    // Additions
    let overtimePay = 0;
    if (attendanceData.status !== 'Custom') {
        const overtimeHours = attendanceData.overtimeHours || 0;
        const overtimeRate = attendanceData.overtimeRate || 0;
        overtimePay = overtimeHours * overtimeRate;
    }

    const extraBonus = attendanceData.extraBonus || 0;
    const customPayment = attendanceData.customPayment || 0;

    // Deductions
    const advancePaid = attendanceData.advancePaid || 0;

    // Formula Requirement (Rule 3)
    const totalDaySalary = baseEarnings + overtimePay + extraBonus + customPayment - advancePaid;

    console.log(`[SalaryEngine] Final Calculation: ${baseEarnings} (Base) + ${overtimePay} (OT) + ${extraBonus} (Bonus) + ${customPayment} (Custom) - ${advancePaid} (Advance) = ₹${totalDaySalary}`);

    return totalDaySalary;
};

/**
 * 2. Calculate Aggregate Salary (Weekly or Monthly)
 * Processes an array of daily attendance records for a specific period to generate a final payslip.
 * 
 * @param {Array} attendanceRecords - Array of attendance documents for the period
 * @returns {Object} Comprehensive salary breakdown
 */
const calculateAggregateSalary = (attendanceRecords) => {
    let totalBaseEarned = 0;
    let totalOvertimePay = 0;
    let totalBonus = 0;
    let totalAdvances = 0;
    let totalCustomPayments = 0;

    let daysPresent = 0;
    let daysAbsent = 0;
    let halfDays = 0;

    attendanceRecords.forEach(record => {
        // 1. Tally attendance counts
        if (record.status === 'Present') daysPresent++;
        if (record.status === 'Absent') daysAbsent++;
        if (record.status === 'Half Day') halfDays++;

        // 2. Break down the pre-calculated totalDaySalary from the DB
        const otPay = (record.overtimeHours || 0) * (record.overtimeRate || 0);
        const bonus = record.extraBonus || 0;
        const custom = record.customPayment || 0;
        const advance = record.advancePaid || 0;

        // In our DB model, totalDaySalary = base + ot + bonus + custom - advance
        // Therefore Base = totalDaySalary - ot - bonus - custom + advance
        const calculatedBaseForDay = record.totalDaySalary - otPay - bonus - custom + advance;

        totalBaseEarned += calculatedBaseForDay;
        totalOvertimePay += otPay;
        totalBonus += bonus;
        totalCustomPayments += custom;
        totalAdvances += advance;
    });

    const grossEarnings = totalBaseEarned + totalOvertimePay + totalBonus + totalCustomPayments;
    const netPayable = grossEarnings - totalAdvances;

    return {
        summary: {
            daysPresent,
            daysAbsent,
            halfDays,
            totalWorkingDays: attendanceRecords.length
        },
        financials: {
            totalBaseEarned: Number(totalBaseEarned.toFixed(2)),
            totalOvertimePay: Number(totalOvertimePay.toFixed(2)),
            totalBonus: Number(totalBonus.toFixed(2)),
            totalCustomPayments: Number(totalCustomPayments.toFixed(2)),
            grossEarnings: Number(grossEarnings.toFixed(2)),
            totalAdvancesDeducted: Number(totalAdvances.toFixed(2)),
            netPayable: Number(netPayable.toFixed(2)) // Final amount contractor needs to pay
        }
    };
};

module.exports = {
    calculateDailySalary,
    calculateAggregateSalary
};
