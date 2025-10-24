const express = require('express');
const router = express.Router();

// Import middlewares and controllers
const { protect } = require('../middleware/authMiddleware');
const { uploadMiddleware } = require('../config/cloudinaryConfig'); 
const { createPin, getAllPins } = require('../controllers/pinController'); // 👈 Import both

// The Pin Creation Route (POST /api/pins)
router.post('/', protect, uploadMiddleware.single('image'), createPin);

// The Get All Pins Route (GET /api/pins)
router.get('/', getAllPins);

module.exports = router;