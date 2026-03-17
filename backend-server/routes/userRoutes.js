const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getUserProfile,
} = require('../controllers/userController');

router.post('/', registerUser);
router.post('/login', loginUser);
// Profile route would ideally use auth middleware
router.get('/profile', getUserProfile);

module.exports = router;
