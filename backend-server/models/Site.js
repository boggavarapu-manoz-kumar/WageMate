const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
    siteName: {
        type: String,
        required: [true, 'Site name is mandatory for tracking'],
        trim: true,
        unique: true
    },
    location: {
        address: {
            type: String,
            required: [true, 'Physical address is required']
        },
        coordinates: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true }
        }
    },
    contractorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    imageUrl: {
        type: String,
        default: 'https://images.unsplash.com/photo-1541888081643-eb3e9d8032bb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    budget: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Site', siteSchema);
