const mongoose = require('mongoose');
const fs = require('fs');

function convertEJSON(obj) {
    if (Array.isArray(obj)) return obj.map(convertEJSON);
    if (obj && typeof obj === 'object') {
        if (obj.$oid) return new mongoose.Types.ObjectId(obj.$oid);
        if (obj.$date) return new Date(obj.$date);
        for (let key in obj) {
            obj[key] = convertEJSON(obj[key]);
        }
    }
    return obj;
}

async function importData() {
    try {
        await mongoose.connect('mongodb://localhost:27017/wagemate');
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;

        if (fs.existsSync('../db_export/workers.json')) {
            const raw = fs.readFileSync('../db_export/workers.json', 'utf8');
            let workersData = JSON.parse(raw);
            workersData = convertEJSON(workersData);
            if (workersData.length > 0) {
                await db.collection('workers').deleteMany({});
                await db.collection('workers').insertMany(workersData);
                console.log(`Imported ${workersData.length} workers.`);
            }
        }

        if (fs.existsSync('../db_export/sites.json')) {
            const raw = fs.readFileSync('../db_export/sites.json', 'utf8');
            let sitesData = JSON.parse(raw);
            sitesData = convertEJSON(sitesData);
            if (sitesData.length > 0) {
                await db.collection('sites').deleteMany({});
                await db.collection('sites').insertMany(sitesData);
                console.log(`Imported ${sitesData.length} sites.`);
            }
        }
        
    } catch (err) {
        console.error('Error importing:', err);
    } finally {
        mongoose.disconnect();
    }
}

importData();
