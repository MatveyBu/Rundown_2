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
    // Initialize default communities and user_community connections
    await initializeSampleData();
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

// Mock user database with three user types
// In production, this would be in a real database

// For demo purposes, let's use plain text passwords (NEVER do this in production!)
// We'll hash them on startup
const plainUsers = [
  { username: 'user1', password: 'user123', role: 'member', first_name: 'John', last_name: 'Doe', email: 'user1@colorado.edu' },
  { username: 'moderator1', password: 'mod123', role: 'moderator', first_name: 'Jane', last_name: 'Smith', email: 'moderator1@colorado.edu' },
  { username: 'admin1', password: 'admin123', role: 'admin', first_name: 'Admin', last_name: 'User', email: 'admin1@colorado.edu' },
  { username: 'MatveyBu', password: 'pass1', role: 'admin', first_name: 'Matvey', last_name: 'Bubalo', email: 'matvey.bubalo@colorado.edu' },
  { username: 'licl', password: 'pass2', role: 'member', first_name: 'Liam', last_name: 'Clinton', email: 'liam.clinton@colorado.edu' },
  { username: 'soree', password: 'pass3', role: 'member', first_name: 'Sofia', last_name: 'Reed', email: 'sofia.reed@colorado.edu' }
];

const plainCommunities = [
  { name: 'Gaming Club', description: 'Community of students interested in video gaming', community_type: 'social', created_by: 4, number_of_members: 1 },
  { name: 'Sustainability Club', description: 'A place for students interested in sustainability to connect', community_type: 'social', created_by: 5, number_of_members: 1 },
  { name: 'Homework Help', description: 'Join a community striving for academic success through collaboration!', community_type: 'academic', created_by: 6, number_of_members: 1 }
];

const plainUsersCommunities = [
  { user_id: 4, community_id: 1 },
  { user_id: 6, community_id: 3 },
  { user_id: 5, community_id: 2 }
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

async function initializeSampleData() {
  try {
    console.log('Initializing sample data...')
    for (const community of plainCommunities) {
      await db.none(
        `INSERT INTO communities (name, description, community_type, created_by, number_of_members)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (name) DO NOTHING`,
        [community.name, community.description, community.community_type, community.created_by, community.number_of_members]
      );
    }
    for (const connection of plainUsersCommunities) {
      await db.none(
        `INSERT INTO users_communities (user_id, community_id)
        VALUES ($1,$2)
        ON CONFLICT (user_id, community_id) DO NOTHING`,
        [connection.user_id, connection.community_id]
      )
    }
    console.log('Sample data initialized successfully');
  } catch (error) {
    console.error('Error initializing sample data:', error);
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

  try {
    // Validate input
    if (!username || !password) {
      return res.render('pages/login', {
        layout: 'main',
        error: 'Please provide both username and password',
        username: username || ''
      });
    }

    // Find user in database
    const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);

    if (!user) {
      console.log('Login failed: User not found:', username);
      return res.render('pages/login', {
        layout: 'main',
        error: 'Invalid username or password',
        username
      });
    }

    // Compare plain text password with hashed password from database
    if (!user.password) {
      console.log('Login failed: User has no password:', username);
      return res.render('pages/login', {
        layout: 'main',
        error: 'Invalid username or password',
        username
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Login failed: Invalid password for user:', username);
      return res.render('pages/login', {
        layout: 'main',
        error: 'Invalid username or password',
        username
      });
    }

    // Create session
    req.session.user = {
      username: user.username,
      user_id: user.user_id,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email
    };

    console.log('Login successful for user:', username);

    // Redirect to home - session will be saved automatically by express-session
    return res.redirect('/home');
  } catch (error) {
    console.error('Login error:', error);
    return res.render('pages/login', {
      layout: 'main',
      error: 'An error occurred. Please try again.',
      username: username || ''
    });
  }
});


app.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  const verificationToken = await db.oneOrNone('SELECT * FROM verification_tokens WHERE token = $1', [token]);
  if (!verificationToken) {
    return res.render('pages/verify-email', {
      layout: 'main',
      error: 'Invalid token'
    });
  }
  await db.none('INSERT INTO users (email, password, username) VALUES ($1, $2, $3)', [verificationToken.email, verificationToken.password, verificationToken.username]);
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
app.get('/register', (req, res) => {
  res.render('pages/register', { layout: 'main' });
});

app.post('/register', async (req, res) => {
  const { email, username, password } = req.body;
  console.log(email, username, password);
  const token = crypto.randomBytes(32).toString('hex');
  const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username])
  if (user != undefined && user.length > 0) {
    return res.status(400).send({ error: 'Username already exists. Please try again.' });
  }
  console.log("After username check");
  const emailUser = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email])
  if (emailUser != undefined && emailUser.length > 0) {
    return res.status(400).send({ error: 'Email already exists. Please try again.' });
  }
  console.log("After validation checks");
  const hash = await bcrypt.hash(password, 10);
  await db.none('INSERT INTO verification_tokens (email, token, username, password) VALUES ($1, $2, $3, $4)', [email, token, username, hash]);

  const mailOptions = {
    from: 'dhilonprasad@gmail.com',
    to: email,
    subject: 'Verification Email',
    text: 'Please verify your email by clicking the link below: http://localhost:3000/verify-email?token=' + token
  };

  // Send email asynchronously without blocking the response
  console.log("Sending email to:", email);
  transporter.sendMail(mailOptions, (error, info) => { //no Promise wrapper needed here because can be asycn and would time out the testcase
    if (error) {
      console.error('Error sending email:', error);
      console.error('Email error details:', error.message, error.code);
    } else {
      console.log("Email sent successfully:", info.response);
    }
  });

  return res.status(200).send({ message: 'Email sent. Please check your email for verification.' });
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
app.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await db.one(
      'SELECT * FROM users WHERE user_id = $1',
      [req.session.user.user_id]
    );

    //simple full name fallback
    user.name = (user.first_name ? user.first_name : '') + (user.last_name ? (' ' + user.last_name) : '');
    if (!user.name.trim()) user.name = user.username;

    //keep session in sync
    req.session.user = user;

    // Return JSON for API requests (tests), HTML for browser requests
    if (req.accepts('json')) {
      return res.status(200).json(user);
    }

    res.render('pages/profile', {
      layout: 'main',
      title: 'My Profile',
      user: user,
      saved: !!req.query.saved
    });
  } catch (e) {
    console.log('GET /profile error:', e);
    if (req.accepts('json')) {
      return res.status(500).json({ error: 'Could not load profile' });
    }
    return res.status(500).render('pages/error', { layout: 'main', error: 'Could not load profile' });
  }
});

//post profile pfp+bio right now
app.post('/profile', isAuthenticated, async (req, res) => {
  const bio = (req.body.bio || '').trim();
  const pic = ((req.body.avatar_url || req.body.profile_picture) || '').trim();

  try {
    //update row
    const result = await db.result(
      'UPDATE users SET bio = $1, profile_picture = $2 WHERE user_id = $3',
      [bio, pic, req.session.user.user_id]
    );
    console.log('updated rows:', result.rowCount);

    if (result.rowCount !== 1) {
      return res.status(400).render('pages/profile', {
        layout: 'main',
        title: 'My Profile',
        user: req.session.user,
        error: 'Could not save changes (no matching user).'
      });
    }

    //reload fresh data for the session + page
    const user = await db.one(
      'SELECT user_id, username, email, role, first_name, last_name, profile_picture, created_at, college_id, bio FROM users WHERE user_id = $1',
      [req.session.user.user_id]
    );

    user.name = (user.first_name ? user.first_name : '') + (user.last_name ? (' ' + user.last_name) : '');
    if (!user.name.trim()) user.name = user.username;

    req.session.user = user;

    //dont want to resubmit on refresh, redirect
    res.redirect('/profile?saved=1');
  } catch (e) {
    console.log('POST /profile error:', e);
    res.status(500).render('pages/profile', {
      layout: 'main',
      title: 'My Profile',
      user: req.session.user,
      error: 'Could not save changes'
    });
  }
});

//profile page change password route
app.post('/profile/change-password', isAuthenticated, async (req, res) => {
  const currentPassword = (req.body.current_password || '').trim();
  const newPassword = (req.body.new_password || '').trim();
  const confirmPassword = (req.body.confirm_password || '').trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).render('pages/profile', {
      layout: 'main',
      title: 'My Profile',
      user: req.session.user,
      error: 'Please fill in all password fields'
    });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).render('pages/profile', {
      layout: 'main',
      title: 'My Profile',
      user: req.session.user,
      error: 'New password and confirmation do not match'
    });
  }

  try {
    const user = await db.one('SELECT password FROM users WHERE user_id = $1', [req.session.user.user_id]);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).render('pages/profile', {
        layout: 'main',
        title: 'My Profile',
        user: req.session.user,
        error: 'Current password is incorrect'
      });
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.none('UPDATE users SET password = $1 WHERE user_id = $2', [hashedNewPassword, req.session.user.user_id]);
    return res.redirect('/profile?saved=1');
  } catch (e) {
    console.log('POST /change-password error:', e);
    return res.status(500).render('pages/profile', {
      layout: 'main',
      title: 'My Profile',
      user: req.session.user,
      error: 'An error occurred while changing the password'
    });
  }
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