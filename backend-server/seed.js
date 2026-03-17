const mongoose = require('mongoose');
const Site = require('./models/Site');
const Worker = require('./models/Worker');
const User = require('./models/User');

const seedData = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/wagemate');
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await Site.deleteMany({});
        await User.deleteMany({});
        await Worker.deleteMany({});

        // Create Admin User
        const admin = await User.create({
            name: 'Manoj Admin',
            email: 'admin@wagemate.com',
            password: 'password123',
            phone: '9876543210',
            role: 'admin'
        });
        console.log('Seed: Admin User Created: admin@wagemate.com / password123');

        const defaultSite = await Site.create({
            siteName: 'Main Construction Site A',
            location: {
                address: '123 Builders Lane, Sricity',
                coordinates: { lat: 13.5281, lng: 80.0242 }
            },
            contractorId: admin._id,
            budget: 500000
        });

        console.log('Seed: Default Site Created with ID:', defaultSite._id);

        process.exit();
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedData();
