let socket;
let currentRoomId = null;
let currentUserName = null;
let currentRoomCode = null;

document.addEventListener('DOMContentLoaded', function() {
  initializeChat();
});

function initializeChat() {
  // Initialize Socket.io
  socket = io();

  socket.on('connect', () => {
    console.log('Connected to server');
  });

  socket.on('new_message', (message) => {
    if (message.room_id == currentRoomId) {
      displayMessage(message);
      scrollToBottom();
    }
    // Update rooms list
    loadRooms();
  });

  // Load initial data
  loadRooms();

  // Setup event listeners
  document.getElementById('userNameInput').addEventListener('input', validateInputs);
  document.getElementById('roomCodeInput').addEventListener('input', validateInputs);
}

function validateInputs() {
  const userName = document.getElementById('userNameInput').value.trim();
  const roomCode = document.getElementById('roomCodeInput').value.trim();
  const joinButton = document.querySelector('#roomCodeInput + button');

  joinButton.disabled = !userName || !roomCode;
}

function loadRooms() {
  fetch('/api/rooms')
    .then(response => response.json())
    .then(rooms => {
      const roomsList = document.getElementById('roomsList');
      roomsList.innerHTML = '';

      if (rooms.length === 0) {
        roomsList.innerHTML = '<p class="text-muted p-3">No rooms available. Create one to get started!</p>';
        return;
      }

      rooms.forEach(room => {
        const roomItem = document.createElement('div');
        roomItem.className = 'room-item p-3 border-bottom';
        roomItem.onclick = () => selectRoom(room);

        const lastMessage = room.last_message || 'No messages yet';
        const time = room.last_message_time ?
          new Date(room.last_message_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
        const messageCount = room.message_count || 0;

        roomItem.innerHTML = `
          <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between">
                <strong>${room.name}</strong>
                <small class="text-muted">${time}</small>
              </div>
              <div class="text-muted small">${lastMessage.substring(0, 40)}${lastMessage.length > 40 ? '...' : ''}</div>
              <div class="text-muted small">Code: ${room.room_code} • ${messageCount} messages</div>
            </div>
          </div>
        `;

        roomsList.appendChild(roomItem);
      });
    })
    .catch(error => console.error('Error loading rooms:', error));
}

function selectRoom(room) {
  const userName = document.getElementById('userNameInput').value.trim();
  if (!userName) {
    alert('Please enter your name first');
    document.getElementById('userNameInput').focus();
    return;
  }

  currentRoomId = room.id;
  currentRoomCode = room.room_code;
  currentUserName = userName;

  // Update UI
  document.getElementById('welcomeScreen').classList.add('d-none');
  document.getElementById('chatArea').classList.remove('d-none');

  // Update chat header
  document.getElementById('chatName').textContent = room.name;
  document.getElementById('roomCodeDisplay').textContent = `(${room.room_code})`;

  // Load messages
  loadMessages(room.id);

  // Join room via socket
  socket.emit('join_room', { roomCode: room.room_code, userName: userName });

  // Highlight active room
  document.querySelectorAll('.room-item').forEach(item => {
    item.classList.remove('active');
  });
  event.currentTarget.classList.add('active');
}

function joinRoom() {
  const userName = document.getElementById('userNameInput').value.trim();
  const roomCode = document.getElementById('roomCodeInput').value.trim().toUpperCase();

  if (!userName || !roomCode) {
    alert('Please enter both your name and room code');
    return;
  }

  // Check if room exists
  fetch(`/api/rooms/${roomCode}`)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error('Room not found');
      }
    })
    .then(room => {
      selectRoom(room);
      document.getElementById('roomCodeInput').value = '';
    })
    .catch(error => {
      alert('Room not found. Please check the room code and try again.');
      console.error('Error joining room:', error);
    });
}

function loadMessages(roomId) {
  fetch(`/api/rooms/${roomId}/messages`)
    .then(response => response.json())
    .then(messages => {
      const messagesContainer = document.getElementById('messagesContainer');
      messagesContainer.innerHTML = '';

      messages.forEach(message => {
        displayMessage(message);
      });

      scrollToBottom();
    })
    .catch(error => console.error('Error loading messages:', error));
}

function displayMessage(message) {
  const messagesContainer = document.getElementById('messagesContainer');
  const messageDiv = document.createElement('div');

  const isSent = message.sender_name === currentUserName;
  messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;

  const time = new Date(message.sent_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  messageDiv.innerHTML = `
    <div class="message-sender">${message.sender_name}</div>
    <div>${message.content}</div>
    <div class="message-time">${time}</div>
  `;

  messagesContainer.appendChild(messageDiv);
}

function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const content = messageInput.value.trim();

  if (!content || !currentRoomId) return;

  socket.emit('send_message', {
    roomId: currentRoomId,
    content: content,
    messageType: 'text'
  });

  messageInput.value = '';
}

function handleKeyPress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

function scrollToBottom() {
  const messagesContainer = document.getElementById('messagesContainer');
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showCreateRoomModal() {
  const modal = new bootstrap.Modal(document.getElementById('createRoomModal'));
  modal.show();
}

function createRoom() {
  const roomCode = document.getElementById('newRoomCode').value.trim().toUpperCase();
  const roomName = document.getElementById('newRoomName').value.trim();

  if (!roomCode || !roomName) {
    alert('Please fill in both room code and name');
    return;
  }

  fetch('/api/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ roomCode, name: roomName })
  })
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      return response.json().then(data => {
        throw new Error(data.error || 'Failed to create room');
      });
    }
  })
  .then(data => {
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('createRoomModal'));
    modal.hide();

    // Clear form
    document.getElementById('newRoomCode').value = '';
    document.getElementById('newRoomName').value = '';

    // Reload rooms
    loadRooms();

    alert(`Room "${roomName}" created successfully! Room code: ${roomCode}`);
  })
  .catch(error => {
    alert(error.message);
    console.error('Error creating room:', error);
  });
}

function leaveRoom() {
  if (currentRoomCode) {
    socket.emit('leave_room');
  }

  currentRoomId = null;
  currentRoomCode = null;

  // Update UI
  document.getElementById('chatArea').classList.add('d-none');
  document.getElementById('welcomeScreen').classList.remove('d-none');

  // Clear messages
  document.getElementById('messagesContainer').innerHTML = '';

  // Remove active highlight
  document.querySelectorAll('.room-item').forEach(item => {
    item.classList.remove('active');
  });
}

function loadFriends() {
  if (!currentUserName) return;

  fetch(`/api/friends/${currentUserName}`)
    .then(response => response.json())
    .then(friends => {
      const friendsList = document.getElementById('friendsList');
      friendsList.innerHTML = '';

      if (friends.length === 0) {
        friendsList.innerHTML = '<p class="text-muted p-3">No friends yet. Add some friends to chat privately!</p>';
        return;
      }

      friends.forEach(friend => {
        const friendItem = document.createElement('div');
        friendItem.className = 'friend-item p-3 border-bottom d-flex justify-content-between align-items-center';

        friendItem.innerHTML = `
          <div>
            <strong>${friend.name}</strong>
            <div class="text-muted small">${friend.status}</div>
          </div>
          <button class="btn btn-sm btn-outline-primary" onclick="startPrivateChat('${friend.name}')">Chat</button>
        `;

        friendsList.appendChild(friendItem);
      });
    })
    .catch(error => console.error('Error loading friends:', error));
}

function addFriend() {
  const friendName = document.getElementById('friendNameInput').value.trim();

  if (!friendName || !currentUserName) {
    alert('Please enter a friend name and make sure you have set your name');
    return;
  }

  if (friendName === currentUserName) {
    alert('You cannot add yourself as a friend');
    return;
  }

  fetch('/api/friends', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userName: currentUserName, friendName: friendName })
  })
  .then(response => response.json())
  .then(data => {
    document.getElementById('friendNameInput').value = '';
    loadFriends();
    alert('Friend added successfully!');
  })
  .catch(error => {
    alert('Failed to add friend');
    console.error('Error adding friend:', error);
  });
}

function startPrivateChat(friendName) {
  // For now, just show an alert. In a full implementation, this would create or join a private room
  alert(`Private chat with ${friendName} - Feature coming soon!`);
}

// Load friends when friends tab is clicked
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('friends-tab').addEventListener('click', function() {
    if (currentUserName) {
      loadFriends();
    } else {
      alert('Please enter your name first');
    }
  });
});
