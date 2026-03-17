const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'UPI', 'Bank Transfer'],
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    periodStart: {
        type: Date, // Start date of the salary period being paid for
    },
    periodEnd: {
        type: Date,   // End date of the salary period being paid for
    },
    paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true, // The admin/contractor who distributed the payment
    },
    referenceId: {
        type: String, // Transaction/Reference ID for UPI or Bank Transfers
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Payment', paymentSchema);
