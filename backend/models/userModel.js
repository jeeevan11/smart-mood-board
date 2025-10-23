const mongoose = require('mongoose');

// This is the schema (the blueprint) for our User data
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true // Removes whitespace
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true // Stores email in lowercase
  },
  password: {
    type: String,
    required: true
  },
  // We will add more fields here later (like profilePic, followers, etc.)
}, {
  // This automatically adds 'createdAt' and 'updatedAt' fields
  timestamps: true 
});

// This creates the 'User' model based on the schema
const User = mongoose.model('User', userSchema);

module.exports = User;