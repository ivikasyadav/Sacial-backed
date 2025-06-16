// index.js
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const http = require('http');
const { initSocket } = require('./socket/socket'); // <-- ref
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/post');
const userRoutes = require('./routes/user');
const path = require('path');

require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect DB
mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB connected'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
// app.use('/api/posts', require('./routes/postRoutes'));

// Socket.IO Init
initSocket(server);

server.listen(5000, () => console.log('Server running on http://localhost:5000'));
