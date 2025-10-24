const Pin = require('../models/pinModel');

// @desc    Create a new Pin
// @route   POST /api/pins
// @access  Private
const createPin = async (req, res) => {
  try {
    // 1. Image URL is provided by Multer/Cloudinary after upload
    const imageUrl = req.file.path; 

    // 2. The user is provided by the 'protect' middleware (authMiddleware)
    const user = req.user._id;

    // 3. Description is taken from the body, if the user provides one (optional)
    const { description } = req.body; 

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image upload failed. No file path found.' });
    }

    // 4. Create the new pin document in MongoDB
    const pin = await Pin.create({
      user,
      imageUrl,
      description: description || 'No description provided.',
    });

    // 5. Send back the new pin to the frontend
    res.status(201).json({
      message: 'Pin created and image uploaded successfully',
      pin,
    });
  } catch (error) {
    console.error(error);
    // Cloudinary errors often show up here
    res.status(500).json({ message: 'Server error during pin creation.' });
  }
};


// @desc    Get all Pins (for the main feed) 👈 MERN-9 Function
// @route   GET /api/pins
// @access  Public
const getAllPins = async (req, res) => {
  try {
    // Find all pins and populate the 'user' field with only username and email
    const pins = await Pin.find({})
      .populate('user', 'username email') 
      .sort({ createdAt: -1 }); // Show newest pins first

    res.status(200).json(pins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching pins.' });
  }
};

// 👇 FIX: Export both functions once at the end
module.exports = {
  createPin,
  getAllPins, 
};