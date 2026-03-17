const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Worker name is mandatory'],
        trim: true,
        index: true
    },
    phone: {
        type: String,
        required: [true, 'Contact number is required'],
        match: [/^\d{10}$/, 'Please provide a valid 10-digit phone number'],
        index: true
    },
    aadhaar: {
        type: String,
        unique: true,
        sparse: true,
        match: [/^\d{12}$/, 'Aadhaar must be exactly 12 digits']
    },
    salaryType: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'daily',
        required: [true, 'Payment cycle (daily/weekly/monthly) is required']
    },
    wageAmount: {
        type: Number,
        required: [true, 'Base wage/salary amount is required'],
        min: [0, 'Wage cannot be negative']
    },
    workType: {
        type: String,
        required: [true, 'Working role (e.g. Mason, Helper) is required'],
        trim: true
    },
    siteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Site',
        required: false
    },
    joinDate: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    photo: {
        type: String, // URL to Cloudinary
        required: [true, 'Worker photo is mandatory for identification']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Worker', workerSchema);
