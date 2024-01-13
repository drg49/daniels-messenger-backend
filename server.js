const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const waitingUsers = [];

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Add user to the waiting list
  waitingUsers.push(socket);

  // Check if there are enough waiting users to pair
  if (waitingUsers.length >= 2) {
    const user1 = waitingUsers.shift();
    const user2 = waitingUsers.shift();

    // Notify paired users
    user1.pair = user2.id;
    user2.pair = user1.id;

    user1.emit('paired', user2.id);
    user2.emit('paired', user1.id);

    console.log(`Users paired: ${user1.id} and ${user2.id}`);
  }

  // Listen for messages
  socket.on('message', (message) => {
    // Broadcast the message to the paired user
    socket.broadcast.to(socket.pair).emit('message', { from: 'stranger', text: message });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);

    // Remove user from the waiting list
    const index = waitingUsers.indexOf(socket);
    if (index !== -1) {
      waitingUsers.splice(index, 1);
    }

    // Notify the paired user about the disconnection
    if (socket.pair) {
      io.to(socket.pair).emit('disconnected');
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
