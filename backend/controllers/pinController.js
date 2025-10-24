const Pin = require('../models/pinModel');

// @desc    Create a new Pin
// @route   POST /api/pins
// @access  Private
const createPin = async (req, res) => {
  try {
    const imageUrl = req.file.path; 
    const user = req.user._id;
    const { description } = req.body; 

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image upload failed. No file path found.' });
    }

    const pin = await Pin.create({
      user,
      imageUrl,
      description: description || 'No description provided.',
    });

    res.status(201).json({
      message: 'Pin created and image uploaded successfully',
      pin,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during pin creation.' });
  }
};


// @desc    Get all Pins (for the main feed) 
// @route   GET /api/pins
// @access  Public
const getAllPins = async (req, res) => {
  try {
    const pins = await Pin.find({})
      .populate('user', 'username email') 
      .sort({ createdAt: -1 }); 

    res.status(200).json(pins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching pins.' });
  }
};


// @desc    Like a pin (or unlike)
// @route   PUT /api/pins/like/:id
// @access  Private
const likePin = async (req, res) => {
  const pinId = req.params.id;
  const userId = req.user._id;

  try {
    const pin = await Pin.findById(pinId);
    if (!pin) {
      return res.status(404).json({ message: 'Pin not found.' });
    }

    // Check if the user has already liked the pin
    if (pin.likes.includes(userId)) {
      // UNLIKE
      pin.likes.pull(userId);
      await pin.save();
      return res.status(200).json({ message: 'Pin unliked successfully.', isLiked: false });
    } else {
      // LIKE
      pin.likes.push(userId);
      await pin.save();
      return res.status(200).json({ message: 'Pin liked successfully.', isLiked: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during like action.' });
  }
};


// @desc    Add a comment to a pin
// @route   POST /api/pins/comment/:id
// @access  Private
const commentPin = async (req, res) => {
  const pinId = req.params.id;
  const userId = req.user._id;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Comment text is required.' });
  }

  try {
    const pin = await Pin.findById(pinId);
    if (!pin) {
      return res.status(404).json({ message: 'Pin not found.' });
    }

    const newComment = {
      user: userId,
      text: text,
    };

    pin.comments.push(newComment);
    await pin.save();

    // Re-fetch and populate the last comment to send back to the user
    const savedPin = await Pin.findById(pinId).populate('comments.user', 'username');

    res.status(201).json({ 
        message: 'Comment added successfully.', 
        comment: savedPin.comments[savedPin.comments.length - 1] 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during comment action.' });
  }
};


module.exports = {
  createPin,
  getAllPins,
  likePin,
  commentPin,
};