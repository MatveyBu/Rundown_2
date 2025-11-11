const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const transporter = require('./email');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect(302, '/login');
  }
  next();
};

// Connect to DB
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

//for form post requests
app.use(express.urlencoded({ extended: true }));
//static files middleware for serving CSS, JS, images, etc.
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
  secret: 'rundown-cu-boulder-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set to true if using https
}));

// Mock user database with three user types
// In production, this would be in a real database

// For demo purposes, let's use plain text passwords (NEVER do this in production!)
// We'll hash them on startup
const plainUsers = [
  { username: 'user1', password: 'user123', role: 'user', first_name: 'John', last_name: 'Doe', email: 'user1@colorado.edu' },
  { username: 'moderator1', password: 'mod123', role: 'moderator', first_name: 'Jane', last_name: 'Smith', email: 'moderator1@colorado.edu', community: 'Housing' },
  { username: 'admin1', password: 'admin123', role: 'admin', first_name: 'Admin', last_name: 'User', email: 'admin1@colorado.edu'}
];

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Handlebars
const hbs = handlebars.create({
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'views', 'partials'),
  helpers: {
    substring: (str, start, end) => {
      if (!str) return '';
      return str.substring(start, end);
    }
  }
});
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

//routes
//redirect to login
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/home');
  }
  return res.redirect('/login');
});

//get login
app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/home');
  }
  res.render('pages/login', { layout: 'main' });
});

//post login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Find user
  const user = plainUsers.find(u => u.username === username);

  if (!user) {
    return res.render('pages/login', {
      layout: 'main',
      error: 'Invalid username or password',
      username
    });
  }

  // Check password (in production, use bcrypt.compare)
  if (password !== user.password) {
    return res.render('pages/login', {
      layout: 'main',
      error: 'Invalid username or password',
      username
    });
  }

  // Create session
  req.session.user = {
    username: user.username,
    role: user.role,
    name: user.name,
    email: user.email,
    community: user.community
  };

  res.redirect('/home');
});


app.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  const verificationToken = await db.one('SELECT * FROM verification_tokens WHERE token = $1', [token]);
  if (!verificationToken) {
    return res.render('pages/verify-email', {
      layout: 'main',
      error: 'Invalid token'
    });
  }
  await db.one('INSERT INTO users (email, password, username) VALUES ($1, $2, $3)', [verificationToken.email, verificationToken.password, verificationToken.username]);
  const user = await db.one('SELECT * FROM users WHERE username = $1', [verificationToken.username]);
  req.session.user = {
    username: user.username,
    role: 'user',
    name: user.name,
    email: user.email,
  };
  await db.none('DELETE FROM verification_tokens WHERE token = $1', [token]);
  return res.redirect('/home');
});
// Register
app.post('/register', async (req, res) => {

  const username = req.body.username;
  const { email } = req.body;
  const token = crypto.randomBytes(32).toString('hex');
  if (await db.one('SELECT * FROM users WHERE username = $1', [username])) {
    res.status(400).send({ message: 'Username already exists. Please try again.' });
    return res.render('pages/register', {
      layout: 'main',
      error: 'Username already exists. Please try again.'
    });
  }
  if (await db.one('SELECT * FROM users WHERE email = $1', [email])) {
    res.status(400).send({ message: 'Email already exists. Please try again.' });
    return res.render('pages/register', {
      layout: 'main',
      error: 'Email already exists. Please try again.'
    });
  }

  const password = req.body.password;
  const hash = await bcrypt.hash(password, 10);
  await db.none('INSERT INTO verification_tokens (email, token, username, password) VALUES ($1, $2, $3, $4)', [email, token, username, hash]);
  const mailOptions = {
    from: 'dhilonprasad@gmail.com',
    to: email,
    subject: 'Verification Email',
    text: 'Please verify your email by clicking the link below: http://localhost:3000/verify-email?token=' + token
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      res.status(500).send({ message: 'Error sending email. Please try again.' });
      return;
    }
    res.status(200).send({ message: 'Email sent. Please check your email for verification.' });
    return;
  });

  // To-DO: Insert username and hashed password into the 'users' table
});

//logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

//get home (protected route)
app.get('/home', isAuthenticated, (req, res) => {
  res.render('pages/home', {
    layout: 'main',
    title: 'Home',
    user: req.session.user
  });
});

//get profile 
app.get('/profile', isAuthenticated, (req, res) => {
  req.session.user.bio = req.session.user.bio || '';
  req.session.user.profile_picture = req.session.user.profile_picture || '';

  res.render('pages/profile', {
    layout: 'main',
    title: 'My Profile',
    user: req.session.user
  });
});

//post profile for bio and PFP
app.post('/profile', isAuthenticated, (req, res) => {
  const { bio, avatar_url, profile_picture } = req.body;

  req.session.user.bio = (bio || '').trim();
  req.session.user.profile_picture = (avatar_url || profile_picture || '').trim();

  // refresh page with saved message
  res.render('pages/profile', {
    layout: 'main',
    title: 'My Profile',
    user: req.session.user,
    saved: true
  });
});


app.get('/welcome', (req, res) => {
  res.json({ status: 'success', message: 'Welcome!' });
});

app.use(auth);

app.get('/test', (req, res) => {
  res.send('Welcome to the protected Test Page!');
});

app.get('/profile', (req, res) => {
  if (!req.session.user) {
    return res.status(401).send('Not authenticated');
  }
  try {
    res.status(200).json({
      username: req.session.user.username,
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = app.listen(3000);
console.log('Server is listening on port 3000');