const fs = require('fs');
const path = require('path');

const uploadToCloudinary = async (base64Image) => {
    try {
        if (!base64Image) return null;

        const cleanBase64 = base64Image.includes('base64,')
            ? base64Image.split('base64,')[1]
            : base64Image;

        const buffer = Buffer.from(cleanBase64, 'base64');
        const filename = `worker_${Date.now()}.jpg`;
        const uploadDir = path.join(__dirname, '../uploads');
        
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        fs.writeFileSync(path.join(uploadDir, filename), buffer);

        // Returning the absolute local server URL to map to standard Cloudinary responses.
        const baseUrl = process.env.BACKEND_URL || 'http://192.168.0.2:5000';
        return `${baseUrl}/uploads/${filename}`;
    } catch (error) {
        console.error('Local Upload Error:', error);
        throw new Error('Failed to save image locally');
    }
};

module.exports = { uploadToCloudinary };
