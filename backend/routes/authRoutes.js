const express = require('express');
const router = express.Router();

// We import the controller function we just made
const { registerUser } = require('../controllers/authController');

// This creates the route
// When a POST request hits '/api/auth/register', it will run registerUser
router.post('/register', registerUser);

// We will add the '/login' route here later

module.exports = router;