document.addEventListener('DOMContentLoaded', function() {
  loadRooms();
  loadFriends();
});

function loadRooms() {
  fetch('/api/admin/rooms')
    .then(response => response.json())
    .then(rooms => {
      const roomsTable = document.getElementById('roomsTable');
      roomsTable.innerHTML = '<h4>Rooms</h4>';

      if (rooms.length === 0) {
        roomsTable.innerHTML += '<p class="text-muted">No rooms found</p>';
        return;
      }

      const table = document.createElement('table');
      table.className = 'table table-striped';
      table.innerHTML = `
        <thead>
          <tr>
            <th>ID</th>
            <th>Room Code</th>
            <th>Name</th>
            <th>Created</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;

      const tbody = table.querySelector('tbody');
      rooms.forEach(room => {
        const row = document.createElement('tr');
        const created = new Date(room.created_at).toLocaleString();
        const updated = new Date(room.updated_at).toLocaleString();

        row.innerHTML = `
          <td>${room.id}</td>
          <td><code>${room.room_code}</code></td>
          <td>${room.name}</td>
          <td>${created}</td>
          <td>${updated}</td>
        `;
        tbody.appendChild(row);
      });

      roomsTable.appendChild(table);
    })
    .catch(error => console.error('Error loading rooms:', error));
}

function loadFriends() {
  // For friends management, we would need an admin endpoint
  // For now, show placeholder
  const friendsTable = document.getElementById('friendsTable');
  friendsTable.innerHTML = '<h4>Friends</h4><p class="text-muted">Friends management to be implemented</p>';
}
