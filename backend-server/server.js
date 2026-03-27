const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Import routes
const workerRoutes = require('./routes/workerRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const siteRoutes = require('./routes/siteRoutes');
const userRoutes = require('./routes/userRoutes');

dotenv.config();

const app = express();

const path = require('path');

// Middleware
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Set up MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wagemate';
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected successfully!'))
    .catch((err) => console.log('MongoDB connection error:', err));

// Register Routes
app.use('/api/workers', workerRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/users', userRoutes);

// Simple health test route
app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'WageMate Backend is Running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
