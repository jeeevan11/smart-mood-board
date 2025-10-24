const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
// 👇 FIX: Import Cloudinary Initializer
const { initializeCloudinary } = require('./config/cloudinaryConfig'); 

// Load environment variables
dotenv.config();

// Create our Express app
const app = express();

// Set port to 5001 (to prevent EADDRINUSE crash)
const PORT = process.env.PORT || 5001; 

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Database & Config Initialization ---
connectDB(); // 👈 FIX: Connects to MongoDB
initializeCloudinary(); // 👈 FIX: Initializes Cloudinary

// --- Routes ---
// Import all route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const pinRoutes = require('./routes/pinRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pins', pinRoutes);

// A simple test route to check if the server is running
app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from the backend! 👋' });
});

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});