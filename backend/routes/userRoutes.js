const express = require('express');
const router = express.Router();

// Import the middleware
const { protect } = require('../middleware/authMiddleware');

// Import new controllers
const { followUser, unfollowUser } = require('../controllers/userController'); 


// @desc    Get current user profile data
// @route   GET /api/users/profile
// @access  Private (Needs a token)
router.get('/profile', protect, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    email: req.user.email,
    message: "You successfully accessed a protected route!"
  });
});

// @desc    Follow a user
// @route   PUT /api/users/follow/:id
// @access  Private
router.put('/follow/:id', protect, followUser); // 👈 NEW ROUTE

// @desc    Unfollow a user
// @route   PUT /api/users/unfollow/:id
// @access  Private
router.put('/unfollow/:id', protect, unfollowUser); // 👈 NEW ROUTE


module.exports = router;