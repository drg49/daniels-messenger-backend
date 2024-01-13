const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const activeUsers = [];

io.on('connection', (socket) => {
  console.log('A user connected');

  // Add user to the active users list
  activeUsers.push(socket.id);

  // Pair random users and create a chat room
  if (activeUsers.length >= 2) {
    const user1 = activeUsers.pop();
    const user2 = activeUsers.pop();

    socket.to(user1).emit('paired', user2);
    socket.to(user2).emit('paired', user1);
  }

  // Listen for messages
  socket.on('message', (message) => {
    // Broadcast the message to the paired user
    socket.broadcast.to(socket.pair).emit('message', message);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected');
    // Remove user from the active users list
    const index = activeUsers.indexOf(socket.id);
    if (index !== -1) {
      activeUsers.splice(index, 1);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
