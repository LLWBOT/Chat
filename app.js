const socket = io();
let currentFriendId = null;

// Fetch and display friend list
async function fetchFriends() {
  const res = await fetch('/api/friends', {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
  const friends = await res.json();
  const list = document.getElementById('friendList');
  list.innerHTML = '';
  friends.forEach(friend => {
    const li = document.createElement('li');
    li.className = 'friend-item';
    li.innerHTML = `<img src="${friend.profilePicture}" /><span>${friend.username}</span>`;
    li.onclick = () => openChat(friend);
    list.appendChild(li);
  });
}

// Open modal to add friend
function openModal() {
  document.getElementById('addFriendModal').style.display = 'block';
}

// Close modal
function closeModal() {
  document.getElementById('addFriendModal').style.display = 'none';
}

// Submit friend request
function submitAddFriend() {
  const uniqueId = document.getElementById('friendIdInput').value;
  if (uniqueId) {
    fetch('/api/add-friend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ uniqueId })
    }).then(() => {
      fetchFriends();
      closeModal();
    });
  }
}

// Open chat with selected friend
async function openChat(friend) {
  currentFriendId = friend.id;
  document.getElementById('chatHeader').textContent = friend.username;
  const res = await fetch(`/api/messages/${friend.id}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
  const messages = await res.json();
  const chat = document.getElementById('chatMessages');
  chat.innerHTML = '';
  messages.forEach(msg => appendMessage(msg));
}

// Format timestamp
function formatTimestamp(ts) {
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Append message to chat window
function appendMessage(msg) {
  const div = document.createElement('div');
  div.textContent = `${msg.senderName}: ${msg.text} (${formatTimestamp(msg.timestamp)})`;
  document.getElementById('chatMessages').appendChild(div);
}

// Send message
function sendMessage() {
  const input = document.getElementById('messageInput');
  const text = input.value;
  if (text && currentFriendId) {
    socket.emit('sendMessage', { to: currentFriendId, text });
    input.value = '';
  }
}

// Emit typing event
document.getElementById('messageInput').addEventListener('input', () => {
  socket.emit('typing', { to: currentFriendId });
});

// Show typing indicator
socket.on('typing', data => {
  if (data.senderId === currentFriendId) {
    const indicator = document.getElementById('typingIndicator');
    indicator.textContent = `${data.senderName} is typing...`;
    setTimeout(() => {
      indicator.textContent = '';
    }, 2000);
  }
});

// Receive message
socket.on('receiveMessage', msg => {
  if (msg.senderId === currentFriendId) {
    appendMessage(msg);
  }
});

// Initial load
fetchFriends();
