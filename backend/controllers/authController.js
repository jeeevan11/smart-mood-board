const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  // 1. Get username, email, and password from the request body
  const { username, email, password } = req.body;

  try {
    // 2. Check if all fields are filled
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    // 3. Check if the user (or email) already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ message: 'User or email already exists' });
    }

    // 4. If user is new, hash the password
    const salt = await bcrypt.genSalt(10); // "salt" makes the hash stronger
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create the new user in the database
    user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();

    // 6. Send a success response (we'll add the JWT token here later)
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// We will add the loginUser function here later

// Export the function so our routes can use it
module.exports = {
  registerUser,
};