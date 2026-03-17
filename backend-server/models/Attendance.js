const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
        required: [true, 'Worker reference is required'],
        index: true
    },
    siteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Site',
        required: [true, 'Site reference is required'],
        index: true
    },
    date: {
        type: String, // Stored as YYYY-MM-DD for easier daily indexing and matching
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Half Day', 'Custom'],
        default: 'Present',
        required: true
    },
    overtimeHours: {
        type: Number,
        default: 0,
        min: 0
    },
    overtimeRate: {
        type: Number,
        default: 0
    },
    extraBonus: {
        type: Number,
        default: 0
    },
    customPayment: {
        type: Number,
        default: 0
    },
    advancePaid: {
        type: Number,
        default: 0
    },
    totalDaySalary: {
        type: Number,
        required: [true, 'Daily calculated salary is required']
    },
    notes: {
        type: String,
        trim: true
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: {
        lat: Number,
        lng: Number
    }
}, {
    timestamps: true
});

// Primary Business Rule: One attendance entry per worker per day
attendanceSchema.index({ workerId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
