const socket = io();
socket.emit('setUser', USERNAME);

const input = document.getElementById('msg');

function sendMessage() {
  if (!input.value.trim()) return;
  socket.emit('message', input.value);
  input.value = '';
}

// ENTER = send
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendMessage();
  }
});

socket.on('message', (msg) => {
  const li = document.createElement('li');
  li.innerText = `${msg.user}: ${msg.text}`;
  document.getElementById('messages').appendChild(li);

  // auto-scroll
  li.scrollIntoView({ behavior: 'smooth' });
});
