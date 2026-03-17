const Worker = require('../models/Worker');
const { uploadToCloudinary } = require('../utils/cloudinaryConfig');

// @desc    Get all workers
// @route   GET /api/workers
// @access  Private (Admin/Supervisor)
const getWorkers = async (req, res) => {
    try {
        const workers = await Worker.find().populate('siteId', 'siteName location');

        // In a real app, if the user is a supervisor, we filter workers by their assigned sites:
        // if (req.user.role === 'supervisor') {
        //   workers = await Worker.find({ siteId: { $in: req.user.sites } });
        // }

        res.status(200).json({
            success: true,
            count: workers.length,
            data: workers
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get single worker
// @route   GET /api/workers/:id
// @access  Private
const getWorker = async (req, res) => {
    try {
        const worker = await Worker.findById(req.params.id).populate('siteId', 'siteName');

        if (!worker) {
            return res.status(404).json({ success: false, error: 'Worker not found' });
        }

        res.status(200).json({
            success: true,
            data: worker
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Create new worker
// @route   POST /api/workers
// @access  Private (Admin only)
const createWorker = async (req, res) => {
    try {
        // 1. Mandatory Photo Check
        if (!req.body.photo) {
            return res.status(400).json({ success: false, error: 'Worker photo is mandatory' });
        }

        // 2. Upload photo to Cloudinary if it's a base64 string
        if (req.body.photo.startsWith('data:image')) {
            const uploadedUrl = await uploadToCloudinary(req.body.photo);
            req.body.photo = uploadedUrl;
        }

        // 3. Normalize Aadhaar: Convert empty string to null to avoid unique constraint violations
        if (req.body.aadhaar === '') {
            delete req.body.aadhaar;
        }

        const worker = await Worker.create(req.body);

        res.status(201).json({
            success: true,
            data: worker
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Update worker
// @route   PUT /api/workers/:id
// @access  Private (Admin only)
const updateWorker = async (req, res) => {
    try {
        // 1. Upload new photo to Cloudinary if updated
        if (req.body.photo && req.body.photo.startsWith('data:image')) {
            const uploadedUrl = await uploadToCloudinary(req.body.photo);
            req.body.photo = uploadedUrl;
        }

        // 2. Normalize Aadhaar
        if (req.body.aadhaar === '') {
            req.body.aadhaar = null;
        }

        const worker = await Worker.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Return updated document
            runValidators: true // Run Mongoose validation on update
        });

        if (!worker) {
            return res.status(404).json({ success: false, error: 'Worker not found' });
        }

        res.status(200).json({
            success: true,
            data: worker
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Delete worker (or soft delete by setting isActive to false)
// @route   DELETE /api/workers/:id
// @access  Private (Admin only)
const deleteWorker = async (req, res) => {
    try {
        const worker = await Worker.findByIdAndDelete(req.params.id);

        if (!worker) {
            return res.status(404).json({ success: false, error: 'Worker not found' });
        }

        res.status(200).json({
            success: true,
            data: {} // Return empty object on delete
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

module.exports = {
    getWorkers,
    getWorker,
    createWorker,
    updateWorker,
    deleteWorker
};
