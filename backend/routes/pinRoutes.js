const express = require('express');
const router = express.Router();

// Import middlewares and controllers
const { protect } = require('../middleware/authMiddleware');
const { uploadMiddleware } = require('../config/cloudinaryConfig'); 
// Import all four pin controller functions
const { createPin, getAllPins, likePin, commentPin } = require('../controllers/pinController'); 

// The Pin Creation Route (POST /api/pins)
router.post('/', protect, uploadMiddleware.single('image'), createPin);

// The Get All Pins Route (GET /api/pins)
router.get('/', getAllPins);

// NEW ROUTES for MERN-11
// 1. Like/Unlike a Pin
router.put('/like/:id', protect, likePin); 

// 2. Add a Comment
router.post('/comment/:id', protect, commentPin);

module.exports = router;