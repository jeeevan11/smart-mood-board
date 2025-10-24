const User = require('../models/userModel');

// @desc    Follow a user
// @route   PUT /api/users/follow/:id
// @access  Private (Needs JWT)
const followUser = async (req, res) => {
  const userToFollowId = req.params.id;
  const currentUserId = req.user._id;

  if (userToFollowId === currentUserId.toString()) {
    return res.status(400).json({ message: 'You cannot follow yourself.' });
  }

  try {
    const userToFollow = await User.findById(userToFollowId);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if already following
    if (currentUser.following.includes(userToFollowId)) {
      return res.status(400).json({ message: 'You already follow this user.' });
    }

    // Update database records
    currentUser.following.push(userToFollowId);
    userToFollow.followers.push(currentUserId);

    await currentUser.save();
    await userToFollow.save();

    // 💡 SOCKET.IO NOTIFICATION LOGIC
    const io = req.app.get('io');
    const userSocketMap = req.app.get('userSocketMap');
    const targetSocketId = userSocketMap[userToFollowId];

    if (targetSocketId) {
      io.to(targetSocketId).emit('newNotification', {
        type: 'follow',
        message: `${currentUser.username} is now following you!`,
        username: currentUser.username,
      });
      console.log(`Follow notification emitted to ${userToFollow.username}`);
    } 

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
    const userToUnfollow = await User.findById(userToUnfollowId);
    const currentUser = await User.findById(currentUserId);

    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Update database records
    currentUser.following.pull(userToUnfollowId);
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