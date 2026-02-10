const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { Server } = require('socket.io');
const User = require('./models/User');
const Message = require('./models/Message');

mongoose.connect('mongodb://127.0.0.1:27017/chatapp');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set('view engine', 'jade');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
  secret: 'secret123',
  resave: false,
  saveUninitialized: false
}));


// middleware بررسی لاگین
function isAuth(req, res, next) {
  if (req.session.userId) next();
  else res.redirect('/login');
}

// routes
app.get('/', isAuth, async (req, res) => {
  const messages = await Message.find().sort({ createdAt: 1 }).limit(100);
  res.render('chat', {
    user: req.session.username,
    messages
  });
});


app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.send('❌ کاربر یافت نشد');

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.send('❌ رمز اشتباه');

  req.session.userId = user._id;
  req.session.username = user.username;
  res.redirect('/');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  try {
    await User.create({ username, password: hash });
    res.redirect('/login');
  } catch {
    res.send('❌ کاربر تکراری');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});
app.get('/clear', (req, res) => {
  Message.deleteMany({}).then(() => {
    console.log('Cleared messages collection');
    res.redirect('/');
  }).catch(err => {
    console.error('Error clearing messages collection:', err);
    res.status(500).send('Error clearing messages collection');
  })
});
// socket.io
io.on('connection', (socket) => {

  socket.on('setUser', (username) => {
    socket.username = username;
  });

  socket.on('message', async (text) => {
    const message = await Message.create({
      user: socket.username,
      text
    });

    io.emit('message', {
      user: message.user,
      text: message.text
    });
  });

});




server.listen(3010, () => {
  console.log('Server running on http://localhost:3000');
});
