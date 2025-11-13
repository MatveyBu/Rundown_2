const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const transporter = require('./email');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server

const auth = (req, res, next) => {
  if (!req.session.user) {
    // Generate absolute URL for redirect
    const protocol = req.protocol || 'http';
    const host = req.get('host') || '127.0.0.1:3000';
    return res.status(302).redirect(`${protocol}://${host}/login`);
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

// test your database and initialize users
db.connect()
  .then(async obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;

    // Initialize default users after database connection is established
    await initializeUsers();
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

//for form post requests
app.use(express.json());
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

// For demo purposes, let's use plain text passwords (NEVER do this in production!)
// We'll hash them on startup
const plainUsers = [
  { username: 'user1', password: 'user123', role: 'member', first_name: 'John', last_name: 'Doe', email: 'user1@colorado.edu' },
  { username: 'moderator1', password: 'mod123', role: 'moderator', first_name: 'Jane', last_name: 'Smith', email: 'moderator1@colorado.edu', community: 'Housing' },
  { username: 'admin1', password: 'admin123', role: 'admin', first_name: 'Admin', last_name: 'User', email: 'admin1@colorado.edu' }
];

// Initialize default users on startup
async function initializeUsers() {
  try {
    console.log('Initializing default users...');
    for (const user of plainUsers) {
      // Hash the password before inserting
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Use ON CONFLICT to avoid errors if users already exist
      await db.none(
        `INSERT INTO users (username, password, role, first_name, last_name, email) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         ON CONFLICT (username) DO NOTHING`,
        [user.username, hashedPassword, user.role, user.first_name, user.last_name, user.email]
      );
    }
    console.log('Default users initialized successfully');
  } catch (error) {
    console.error('Error initializing users:', error);
  }
}

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).send({ message: 'Not authenticated' });
    return;
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
    role: 'user',
    name: user.name,
    email: user.email,
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

//get profile 
app.get('/profile', isAuthenticated, async (req, res) => {

  try {
    const userData = {
      username: req.session.user.username,
      email: req.session.user.email,
      role: req.session.user.role,
      profile_picture: req.session.user.profile_picture,
      created_at: req.session.user.created_at,
      college_id: req.session.user.college_id,
      bio: req.session.user.bio
    };

    // Check if client wants JSON (test/API) or HTML (browser)
    if (req.accepts('json') && !req.accepts('html')) {
      return res.status(200).json(userData);
    }

    // Otherwise render the page
    return res.status(200).render('pages/profile', {
      layout: 'main',
      title: 'My Profile',
      ...userData,
      saved: true
    });

  } catch (err) {
    console.error('Profile error:', err);

    // Return JSON error if client wants JSON
    if (req.accepts('json') && !req.accepts('html')) {
      return res.status(500).json({ error: 'Could not load profile' });
    }

    return res.status(500).render('pages/error', {
      layout: 'main',
      error: 'Could not load profile'
    });
  }

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
  if (!req.session.user) {
    // Generate absolute URL for redirect
    const protocol = req.protocol || 'http';
    const host = req.get('host') || '127.0.0.1:3000';
    return res.status(302).redirect(`${protocol}://${host}/login`);
  }
  res.status(200).send({ message: 'Welcome to the protected Test Page!' });
});

module.exports = app.listen(3000);
console.log('Server is listening on port 3000');