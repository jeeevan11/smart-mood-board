const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// --- 1. Initialization Function (Called by server.js) ---
const initializeCloudinary = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log("Cloudinary Initialized.");
};

// --- 2. Create the Storage Engine and Middleware ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  // 👇 FIX: 'params' is a function so we can safely access req.user
  params: (req, file) => {
    return {
      folder: 'smart-mood-board-pins', 
      allowed_formats: ['jpg', 'png', 'jpeg'],
      // We are getting the username from the 'protect' middleware (req.user)
      public_id: `${req.user.username}/${Date.now()}-${file.originalname.substring(0, 10)}`, 
    };
  }
});

const uploadMiddleware = multer({ storage: storage });

module.exports = {
  cloudinary, 
  initializeCloudinary, // Export the function for server.js
  uploadMiddleware, 
};