const express = require('express');
const router = express.Router();

// Import middlewares and controllers
const { protect } = require('../middleware/authMiddleware');
const { uploadMiddleware } = require('../config/cloudinaryConfig'); 
const { createPin } = require('../controllers/pinController');

// 👇 FIX: This order is critical: protect -> upload -> controller
router.post('/', protect, uploadMiddleware.single('image'), createPin);

module.exports = router;