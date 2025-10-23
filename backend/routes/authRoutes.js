const express = require('express');
const router = express.Router();

// Import both controller functions
const { registerUser, loginUser } = require('../controllers/authController');

// Register route
router.post('/register', registerUser);

// Login route
router.post('/login', loginUser); // 👈 You are adding this line

module.exports = router;