let io;
const connectedUsers = new Map();

const initSocket = (server) => {
    io = require('socket.io')(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173', 
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`A user connected: ${socket.id}`);

        socket.on('join', (userId) => {
            console.log(`User ${userId} joined with socket ${socket.id}`);
            const userSockets = connectedUsers.get(userId) || [];
            if (!userSockets.includes(socket.id)) {
                userSockets.push(socket.id);
            }
            connectedUsers.set(userId, userSockets);

            socket.userId = userId;
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            if (socket.userId) {
                const userSockets = connectedUsers.get(socket.userId);
                if (userSockets) {
                    const updatedSockets = userSockets.filter(id => id !== socket.id);
                    if (updatedSockets.length === 0) {
                        connectedUsers.delete(socket.userId);
                    } else {
                        connectedUsers.set(socket.userId, updatedSockets);
                    }
                }
            }
        });
    });
};

const getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

const notifyFollowers = (followerIds, data) => {
    const io = getIo();
    followerIds.forEach(followerId => {
        const sockets = connectedUsers.get(followerId); 
        if (sockets && sockets.length > 0) {
            sockets.forEach(socketId => {
                io.to(socketId).emit('new-post', data); 
            });
        }
    });
};

const broadcastToAllClients = (data) => {
    const io = getIo();
    io.emit('new-post', data);
};

module.exports = {
    initSocket,
    getIo,
    notifyFollowers,
    broadcastToAllClients,
};