const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// This function checks if a request has a valid JWT token
const protect = async (req, res, next) => {
  let token;

  // 1. Check if the token exists in the 'Authorization' header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (it looks like 'Bearer TOKEN_STRING')
      token = req.headers.authorization.split(' ')[1];

      // 2. Verify the token using our secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Get the user (minus their password) from the ID in the token
      req.user = await User.findById(decoded.id).select('-password');

      // If all checks pass, move to the next function (the controller)
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // If no token is found at all
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };