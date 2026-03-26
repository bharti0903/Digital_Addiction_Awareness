let ioInstance = null;

const initSocket = (server) => {
  const { Server } = require("socket.io");

  ioInstance = new Server(server);

  ioInstance.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("joinUserRoom", (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return ioInstance;
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized");
  }
  return ioInstance;
};

module.exports = { initSocket, getIO };