const express = require('express');
const {
    getWorkers,
    getWorker,
    createWorker,
    updateWorker,
    deleteWorker
} = require('../controllers/workerController');

// In a real application, you would import auth middleware here:
// const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Route: /api/workers
router
    .route('/')
    .get(getWorkers) // GET /api/workers
    // .post(protect, authorize('admin'), createWorker); // Real app implementation
    .post(createWorker); // POST /api/workers

router
    .route('/:id')
    .get(getWorker) // GET /api/workers/:id
    .put(updateWorker) // PUT /api/workers/:id
    .delete(deleteWorker); // DELETE /api/workers/:id

module.exports = router;
