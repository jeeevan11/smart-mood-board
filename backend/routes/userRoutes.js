const express = require('express');
const router = express.Router();

// Import the middleware
const { protect } = require('../middleware/authMiddleware');

// @desc    Get current user profile data
// @route   GET /api/users/profile
// @access  Private (Needs a token)
router.get('/profile', protect, (req, res) => {
  // If the 'protect' middleware passes, we know 'req.user' exists
  res.json({
    id: req.user.id,
    username: req.user.username,
    email: req.user.email,
    message: "You successfully accessed a protected route!"
  });
});

module.exports = router;