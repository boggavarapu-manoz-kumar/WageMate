const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a base64 image string to Cloudinary
 * @param {string} base64Image - The base64 string of the image
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
const uploadToCloudinary = async (base64Image) => {
    try {
        if (!base64Image) return null;

        // Remove data:image/jpeg;base64, prefix if present
        const cleanBase64 = base64Image.includes('base64,')
            ? base64Image.split('base64,')[1]
            : base64Image;

        const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${cleanBase64}`, {
            folder: 'wagemate_workers',
            resource_type: 'image'
        });

        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        throw new Error('Failed to upload image to cloud storage');
    }
};

module.exports = { uploadToCloudinary };
