const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (base64Image) => {
    try {
        if (!base64Image) return null;

        // Ensure it has the proper data URI prefix
        const imageData = base64Image.startsWith('data:image')
            ? base64Image
            : `data:image/jpeg;base64,${base64Image}`;

        // Upload directly to Cloudinary using base64
        const result = await cloudinary.uploader.upload(imageData, {
            folder: 'wagemate',
            resource_type: 'image',
            transformation: [{ width: 500, height: 500, crop: 'limit', quality: 'auto' }]
        });

        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        throw new Error('Failed to upload image to Cloudinary');
    }
};

module.exports = { uploadToCloudinary };
