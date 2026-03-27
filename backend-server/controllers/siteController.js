const Site = require('../models/Site');
const { uploadToCloudinary } = require('../utils/cloudinaryConfig');

// @desc    Get all active sites
// @route   GET /api/sites
// @access  Private
const getSites = async (req, res) => {
    try {
        const sites = await Site.find({ isActive: true });
        res.status(200).json({ success: true, count: sites.length, data: sites });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Create new site
// @route   POST /api/sites
// @access  Private
const createSite = async (req, res) => {
    try {
        let imageUrl = req.body.imageUrl;
        if (imageUrl && imageUrl.startsWith('data:image')) {
            imageUrl = await uploadToCloudinary(imageUrl);
        }

        const site = await Site.create({
            ...req.body,
            imageUrl,
            contractorId: req.user?.id || '64a1b2c3d4e5f60012345678' // Fallback for dev
        });
        res.status(201).json({ success: true, data: site });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Update a site
// @route   PUT /api/sites/:id
// @access  Private
const updateSite = async (req, res) => {
    try {
        const site = await Site.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!site) {
            return res.status(404).json({ success: false, error: 'Site not found' });
        }

        res.status(200).json({ success: true, data: site });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Delete a site
// @route   DELETE /api/sites/:id
// @access  Private
const deleteSite = async (req, res) => {
    try {
        const site = await Site.findById(req.params.id);

        if (!site) {
            return res.status(404).json({ success: false, error: 'Site not found' });
        }

        await site.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

module.exports = {
    getSites,
    createSite,
    updateSite,
    deleteSite
};
