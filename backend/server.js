const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http'); // Import http
const { Server } = require('socket.io'); // Import Socket.io Server

const connectDB = require('./config/db');
const { initializeCloudinary } = require('./config/cloudinaryConfig'); 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080; 

// --- Socket.io Initialization (The most robust way) ---
const server = http.createServer(app); 
const io = new Server(server, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST']
  }
});
console.log('Socket.io server initialized.');

// This will store a mapping of UserID to SocketID
const userSocketMap = {}; 

// Handle new socket connections
io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    const userId = socket.handshake.query.userId;
    if (userId !== undefined) {
        userSocketMap[userId] = socket.id;
        console.log(`User ${userId} connected with socket ${socket.id}`);
    }

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        for (const id in userSocketMap) {
            if (userSocketMap[id] === socket.id) {
                delete userSocketMap[id];
                break;
            }
        }
    });
});

app.set('io', io); // Make io available in all route handlers
app.set('userSocketMap', userSocketMap); // Make the map available

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Database & Config Initialization ---
connectDB(); 
initializeCloudinary();

// --- Routes ---
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const pinRoutes = require('./routes/pinRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pins', pinRoutes);

app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from the backend! 👋' });
});

// --- Start the Server (Use the 'server' object) ---
server.listen(PORT, () => { 
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});