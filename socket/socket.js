const { Server } = require("socket.io");

let io;
const connectedUsers = {};

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);

        socket.on("join", (userId) => {
            connectedUsers[userId] = socket.id;
            console.log(`User ${userId} joined with socket ${socket.id}`);
        });

        socket.on("disconnect", () => {
            for (let userId in connectedUsers) {
                if (connectedUsers[userId] === socket.id) {
                    delete connectedUsers[userId];
                    console.log(`User ${userId} disconnected`);
                    break;
                }
            }
        });
    });
};

const notifyFollowers = (followers, post) => {
    followers.forEach((followerId) => {
        const socketId = connectedUsers[followerId];
        if (socketId && io) {
            io.to(socketId).emit("new-post", post);
        }
    });
};


const notifyUserById = (userId, payload) => {
    const socketId = connectedUsers[userId];
    if (socketId && io) {
        io.to(socketId).emit('user-event', payload);
    }
};
function broadcastToAllClients(event, data) {
    connectedUsers.forEach(socket => {
        socket.emit(event, data);
    });
}

module.exports = {
    initSocket,
    notifyUserById,
    notifyFollowers,
    broadcastToAllClients,
    connectedUsers,
};


