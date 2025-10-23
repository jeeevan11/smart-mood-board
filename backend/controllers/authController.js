const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- Helper Function to Generate JWT ---
// We'll use this in both login and register
const generateToken = (id) => {
  // 'process.env.JWT_SECRET' is a secret key we need to add to our .env file
  // '30d' means the token will be valid for 30 days
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};


// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ message: 'User or email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();

    // --- Generate a token for the new user ---
    const token = generateToken(user._id);

    // Send the token back
    res.status(201).json({
      message: 'User registered successfully',
      token, // Send the token to the user
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


// @desc    Login (Authenticate) a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check if user exists by email
    const user = await User.findOne({ email });

    // 2. If user exists, compare the sent password with the hashed password
    if (user && (await bcrypt.compare(password, user.password))) {
      
      // 3. Passwords match! Generate a token.
      const token = generateToken(user._id);
      
      // 4. Send back the token and user info
      res.status(200).json({
        message: 'Login successful',
        token, // Send the token
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      });
    } else {
      // 4. User doesn't exist or password didn't match
      return res.status(400).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};


// Export both functions
module.exports = {
  registerUser,
  loginUser, // Add the new login function here
};