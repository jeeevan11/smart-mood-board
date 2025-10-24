const User = require('../models/userModel');

// @desc    Follow a user
// @route   PUT /api/users/follow/:id
// @access  Private (Needs JWT)
const followUser = async (req, res) => {
  // The user to be followed is in req.params.id
  const userToFollowId = req.params.id;
  // The user doing the following is in req.user._id (from the protect middleware)
  const currentUserId = req.user._id;

  // Prevent user from following themselves
  if (userToFollowId === currentUserId.toString()) {
    return res.status(400).json({ message: 'You cannot follow yourself.' });
  }

  try {
    // 1. Find the user to follow
    const userToFollow = await User.findById(userToFollowId);
    // 2. Find the current user
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if already following
    if (currentUser.following.includes(userToFollowId)) {
      return res.status(400).json({ message: 'You already follow this user.' });
    }

    // Add to current user's following list
    currentUser.following.push(userToFollowId);
    // Add to followed user's followers list
    userToFollow.followers.push(currentUserId);

    await currentUser.save();
    await userToFollow.save();

    res.status(200).json({ message: 'User followed successfully.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during follow action.' });
  }
};


// @desc    Unfollow a user
// @route   PUT /api/users/unfollow/:id
// @access  Private (Needs JWT)
const unfollowUser = async (req, res) => {
  const userToUnfollowId = req.params.id;
  const currentUserId = req.user._id;

  try {
    // 1. Find the user to unfollow
    const userToUnfollow = await User.findById(userToUnfollowId);
    // 2. Find the current user
    const currentUser = await User.findById(currentUserId);

    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Remove from current user's following list
    currentUser.following.pull(userToUnfollowId);
    // Remove from unfollowed user's followers list
    userToUnfollow.followers.pull(currentUserId);

    await currentUser.save();
    await userToUnfollow.save();

    res.status(200).json({ message: 'User unfollowed successfully.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during unfollow action.' });
  }
};

module.exports = {
  followUser,
  unfollowUser,
};