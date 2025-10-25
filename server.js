const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 3000;

// Import modules
const db = require('./db');
const Message = require('./message');

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Room routes
app.post('/api/rooms', async (req, res) => {
  try {
    const { roomCode, name } = req.body;
    const roomId = await Message.createRoom(roomCode, name);
    res.json({ roomId, roomCode });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      res.status(400).json({ error: 'Room code already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create room' });
    }
  }
});

app.get('/api/rooms/:code', async (req, res) => {
  try {
    const room = await Message.getRoomByCode(req.params.code);
    if (room) {
      res.json(room);
    } else {
      res.status(404).json({ error: 'Room not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to get room' });
  }
});

app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await Message.getAllRooms();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get rooms' });
  }
});

app.get('/api/rooms/:id/messages', async (req, res) => {
  try {
    const messages = await Message.getMessages(req.params.id);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Friends routes
app.get('/api/friends/:userName', async (req, res) => {
  try {
    const friends = await Message.getFriends(req.params.userName);
    res.json(friends);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get friends' });
  }
});

app.post('/api/friends', async (req, res) => {
  try {
    const { userName, friendName } = req.body;
    await Message.addFriend(userName, friendName);
    res.json({ message: 'Friend added' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add friend' });
  }
});

// Admin routes
app.get('/api/admin/rooms', (req, res) => {
  db.all("SELECT * FROM rooms ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Failed to get rooms' });
    } else {
      res.json(rows);
    }
  });
});

// Socket.io connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (data) => {
    const { roomCode, userName } = data;
    socket.roomCode = roomCode;
    socket.userName = userName;
    socket.join(roomCode);
    console.log(`${userName} joined room ${roomCode}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { roomId, content, messageType } = data;
      const messageId = await Message.sendMessage(roomId, socket.userName, content, messageType);

      // Get the message
      const messages = await Message.getMessages(roomId, 1);
      const message = messages[0];

      // Send to all users in the room
      io.to(socket.roomCode).emit('new_message', message);
    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('leave_room', () => {
    if (socket.roomCode) {
      socket.leave(socket.roomCode);
      console.log(`${socket.userName} left room ${socket.roomCode}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Chat app running on http://localhost:${PORT}`);
});
