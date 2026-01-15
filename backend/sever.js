const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173' }
});

// In-memory stores (replace with DB in prod)
const rooms = {
  general: [],
  random: []
};

// REST endpoint to fetch recent messages for a room
app.get('/rooms/:room/messages', (req, res) => {
  const room = req.params.room;
  const messages = rooms[room] || [];
  res.json(messages.slice(-200));
});

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  // track current room for simple leave handling
  socket.currentRoom = null;

  socket.on('join_room', (room) => {
    if (socket.currentRoom) {
      socket.leave(socket.currentRoom);
      io.to(socket.currentRoom).emit('user_left', { socketId: socket.id });
    }
    socket.join(room);
    socket.currentRoom = room;
    io.to(room).emit('user_joined', { socketId: socket.id });
    console.log(`${socket.id} joined ${room}`);
  });

  socket.on('leave_room', (room) => {
    socket.leave(room);
    io.to(room).emit('user_left', { socketId: socket.id });
    socket.currentRoom = null;
  });

  socket.on('send_message', ({ room, author, content }) => {
    const msg = {
      id: Date.now().toString() + Math.random().toString(36).slice(2,6),
      author: author || 'anon',
      content: content || '',
      createdAt: new Date().toISOString()
    };
    rooms[room] = rooms[room] || [];
    rooms[room].push(msg);
    // Broadcast to room
    io.to(room).emit('message_created', msg);
  });

  socket.on('typing', ({ room, author }) => {
    socket.to(room).emit('typing', { socketId: socket.id, author });
  });

  socket.on('stop_typing', ({ room, author }) => {
    socket.to(room).emit('stop_typing', { socketId: socket.id, author });
  });

  socket.on('disconnect', () => {
    if (socket.currentRoom) {
      io.to(socket.currentRoom).emit('user_left', { socketId: socket.id });
    }
    console.log('socket disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
