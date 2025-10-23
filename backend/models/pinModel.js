const mongoose = require('mongoose');
const { Schema } = mongoose;

// This is the blueprint for our "Pin" (image post)
const pinSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId, // This links the pin to a user
    ref: 'User', // It refers to the 'User' model we just made
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User' // A list of users who liked this pin
  }],
  comments: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  // Automatically adds 'createdAt' and 'updatedAt'
  timestamps: true
});

const Pin = mongoose.model('Pin', pinSchema);

module.exports = Pin;