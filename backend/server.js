const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// This line loads your .env file variables into process.env
dotenv.config();

// Create our Express app
const app = express();

// Set a default port or use the one from the .env file
const PORT = process.env.PORT || 5000;

// --- Middlewares ---
// Enable CORS (so your frontend can talk to this backend)
app.use(cors());
// Enable Express to parse JSON in request bodies
app.use(express.json());

// --- Test Route ---
// A simple "GET" route to check if the server is running
// Import auth routes
const authRoutes = require('./routes/authRoutes');

// Use auth routes
// This tells the server that any URL starting with /api/auth
// should be handled by the 'authRoutes' file.
app.use('/api/auth', authRoutes);
// Import user routes
const userRoutes = require('./routes/userRoutes');

// Use user routes
app.use('/api/users', userRoutes);
app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from the backend! 👋' });
});
// Connect to MongoDB
connectDB();
// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});