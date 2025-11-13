const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server

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

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// Mock user database with three user types
// In production, this would be in a real database
const users = [
  {
    username: 'user1',
    password: '$2b$10$YourHashedPasswordHere1', // password: 'user123'
    role: 'user',
    name: 'John Doe',
    email: 'user1@colorado.edu'
  },
  {
    username: 'moderator1',
    password: '$2b$10$YourHashedPasswordHere2', // password: 'mod123'
    role: 'moderator',
    name: 'Jane Smith',
    email: 'moderator1@colorado.edu',
    community: 'Housing'
  },
  {
    username: 'admin1',
    password: '$2b$10$YourHashedPasswordHere3', // password: 'admin123'
    role: 'admin',
    name: 'Admin User',
    email: 'admin1@colorado.edu'
  }
];

// For demo purposes, let's use plain text passwords (NEVER do this in production!)
// We'll hash them on startup
const plainUsers = [
  { username: 'user1', password: 'user123', role: 'user', name: 'John Doe', email: 'user1@colorado.edu' },
  { username: 'moderator1', password: 'mod123', role: 'moderator', name: 'Jane Smith', email: 'moderator1@colorado.edu', community: 'Housing' },
  { username: 'admin1', password: 'admin123', role: 'admin', name: 'Admin User', email: 'admin1@colorado.edu' }
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

//Navbar
/*
app.get("/navbar-test", (req, res) => {
  res.render("partials/navbar");
});
*/

app.get("/search", (req, res) => {
  const query = req.query.q;

  console.log("Search query:", query);

  res.send("You searched for: " + query);
});


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
    user: req.session.user,
    activeHome: true
  });
});

app.get('/welcome', (req, res) => {
  res.json({ status: 'success', message: 'Welcome!' });
});

module.exports = app.listen(3000);
console.log('Server is listening on port 3000');