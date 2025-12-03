const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const multer = require('multer');
const fs = require('fs');
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
  host: process.env.HOST, // the database server
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

// Set up multer for file uploads
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

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
  { username: 'soree', password: 'pass3', role: 'member', first_name: 'Sofia', last_name: 'Reed', email: 'sofia.reed@colorado.edu' },
  { username: 'tmit', password: 'pass4', role: 'member', first_name: 'Tom', last_name: 'Mitchell', email: 'tom.mitchell@colorado.edu'},
  { username: 'mlee', password: 'pass5', role: 'member', first_name: 'Mia', last_name: 'Lee', email: 'mia.lee@colorado.edu'},
  { username: 'ivsh', password: 'pass6', role: 'member', first_name: 'Ivan', last_name: 'Shishkin', email: 'ivan.shishkin@colorado.edu'},
  { username: 'kebr', password: 'pass7', role: 'member', first_name: 'Kevin', last_name: 'Brown', email: 'kevin.brown@colorado.edu'}
];

const plainCommunities = [
  { name: 'Housing', description: 'Community of students interested in housing', community_type: 'social', created_by: 4, number_of_members: 1 }, //make sure when people register, everyone is added to housing and lost & found communities and clubs & sports communities and classes communities
  { name: 'Lost & Found', description: 'Community of students interested in lost & found', community_type: 'social', created_by: 4, number_of_members: 1 },
  { name: 'Clubs & Sports', description: 'Community of students interested in clubs & sports', community_type: 'social', created_by: 4, number_of_members: 1 },
  { name: 'Classes', description: 'Community of students interested in classes', community_type: 'academic', created_by: 4, number_of_members: 1 },
  { name: 'Gaming Club', description: 'Community of students interested in video gaming', community_type: 'social', created_by: 4, number_of_members: 1 },
  { name: 'Sustainability Club', description: 'A place for students interested in sustainability to connect', community_type: 'social', created_by: 5, number_of_members: 1 },
  { name: 'Homework Help', description: 'Join a community striving for academic success through collaboration!', community_type: 'academic', created_by: 6, number_of_members: 1 }
];

const plainPosts = [
  { text: 'I love playing video games!', user_id: 4, community_id: 5 },
  { text: 'I love sustainability!', user_id: 5, community_id: 6 },
  { text: 'I need help with my homework!', user_id: 6, community_id: 7 },
  { text: 'We should set up a LAN for this weekend', user_id: 9, community_id: 5},
  { text: 'Hit me up if you want to join our intermural Flag Football team!', user_id: 7, community_id: 3},
  { text: 'Does anyone know a good elective for Spring semester?', user_id: 8, community_id: 4},
  { text: 'Found a blue hydroflask with a Will Vill sticker on it, lmk if it is yours', user_id: 4, community_id: 2}
];

const plainUsersCommunities = [
  { user_id: 4, community_id: 1 },
  { user_id: 4, community_id: 2 },
  { user_id: 4, community_id: 3 },
  { user_id: 4, community_id: 4 },
  { user_id: 5, community_id: 1 },
  { user_id: 5, community_id: 2 },
  { user_id: 5, community_id: 3 },
  { user_id: 5, community_id: 4 },
  { user_id: 6, community_id: 1 },
  { user_id: 6, community_id: 2 },
  { user_id: 6, community_id: 3 },
  { user_id: 6, community_id: 4 },
  { user_id: 4, community_id: 5 },
  { user_id: 4, community_id: 6 },
  { user_id: 4, community_id: 7 },
  { user_id: 6, community_id: 7 },
  { user_id: 5, community_id: 6 },
  { user_id: 7, community_id: 3},
  { user_id: 8, community_id: 2},
  { user_id: 8, community_id: 4},
  { user_id: 8, community_id: 6},
  { user_id: 9, community_id: 1},
  { user_id: 9, community_id: 3},
  { user_id: 9, community_id: 5},
  { user_id: 9, community_id: 7}
];

const plainPostLikes = [
  { user_id: 4, post_id: 1 },
  { user_id: 5, post_id: 2 },
  { user_id: 6, post_id: 3 }
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
    // Insert posts and get their actual IDs
    const insertedPostIds = [];
    for (const post of plainPosts) {
      // Check if an identical post already exists
      const existingPost = await db.oneOrNone(
        `SELECT post_id FROM posts WHERE text = $1 AND user_id = $2 AND community_id = $3 LIMIT 1`,
        [post.text, post.user_id, post.community_id]
      );

      if (existingPost) {
        insertedPostIds.push(existingPost.post_id);
        continue;
      }

      const result = await db.one(
        `INSERT INTO posts (text, user_id, community_id) VALUES ($1, $2, $3) RETURNING post_id`,
        [post.text, post.user_id, post.community_id]
      );
      insertedPostIds.push(result.post_id);
    }

    // Insert post likes using the actual post IDs, only if identical like doesn't exist
    for (let i = 0; i < plainPostLikes.length && i < insertedPostIds.length; i++) {
      const likeUserId = plainPostLikes[i].user_id;
      const likePostId = insertedPostIds[i];

      const existingLike = await db.oneOrNone(
        `SELECT 1 FROM post_likes WHERE user_id = $1 AND post_id = $2 LIMIT 1`,
        [likeUserId, likePostId]
      );

      if (!existingLike) {
        await db.none(
          `INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2)`,
          [likeUserId, likePostId]
        );
      }
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
    // Check if it's an API/test request (wants JSON)
    const acceptHeader = req.get('Accept') || '';
    const contentType = req.get('Content-Type') || '';
    const userAgent = req.get('User-Agent') || '';

    // Check for JSON headers OR if it's a test client (node-superagent is used by chai-http)
    const wantsJson = acceptHeader.includes('application/json') || 
                      contentType.includes('application/json') ||
                      userAgent.includes('node-superagent');

    if (wantsJson) {
      // Return error for test/API requests
      return res.status(401).send({ message: 'Not authenticated' });
    } else {
      // Redirect to login for browser requests
      return res.redirect('/login');
    }
  }
};

// create a new community
app.post('/communities/new', isAuthenticated, async (req, res) => {
  const name = (req.body.name || '').trim();
  const description = (req.body.description || '').trim();
  const communityType = (req.body.community_type || 'social').trim();
  const userId = req.session.user.user_id;

  if (!name) {
    // Get user's communities to re-render the page
    const communities = await db.any(
      `SELECT c.*
       FROM communities c
       JOIN users_communities uc ON uc.community_id = c.community_id
       WHERE uc.user_id = $1`,
      [userId]
    );

    return res.status(400).render('pages/communities', {
      layout: 'main',
      title: 'Communities',
      user: req.session.user,
      communities,
      error: 'Community name is required'
    });
  }

  try {
    // Insert community and get its id
    const result = await db.one(
      `INSERT INTO communities (name, description, community_type, created_by, number_of_members)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING community_id`,
      [name, description, communityType, userId, 1]
    );

    const communityId = result.community_id;

    // Auto-join creator
    await db.none(
      `INSERT INTO users_communities (user_id, community_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, community_id) DO NOTHING`,
      [userId, communityId]
    );

    return res.redirect(`/communities/${communityId}`);
  } catch (e) {
    console.log('POST /communities/new error:', e);

    // Duplicate community name
    if (e.code === '23505') {
      // Get the existing community with that name
      const existing = await db.one(
        `SELECT community_id, name, description
         FROM communities
         WHERE name = $1`,
        [name]
      );

      // Get user's communities for the page
      const communities = await db.any(
        `SELECT c.*
         FROM communities c
         JOIN users_communities uc ON uc.community_id = c.community_id
         WHERE uc.user_id = $1`,
        [userId]
      );

      return res.status(200).render('pages/communities', {
        layout: 'main',
        title: 'Communities',
        user: req.session.user,
        communities,
        error: 'A community with that name already exists.',
        showDuplicateModal: true,
        duplicateCommunity: existing
      });
    }

    // Any other DB error
    const communities = await db.any(
      `SELECT c.*
       FROM communities c
       JOIN users_communities uc ON uc.community_id = c.community_id
       WHERE uc.user_id = $1`,
      [userId]
    );

    return res.status(500).render('pages/communities', {
      layout: 'main',
      title: 'Communities',
      user: req.session.user,
      communities,
      error: 'An unexpected error occurred while creating the community.'
    });
  }
});

// Delete a community (only site admin or the community creator)
app.post('/communities/:community_id/delete', isAuthenticated, async (req, res) => {
  const communityId = parseInt(req.params.community_id, 10);
  if (Number.isNaN(communityId)) {
    return res.status(400).send('Invalid community id');
  }

  try {
    const community = await db.oneOrNone(
      `SELECT * FROM communities WHERE community_id = $1`,
      [communityId]
    );

    if (!community) {
      return res.status(404).send('Community not found');
    }

    const user = req.session.user;
    const isSiteAdmin = user.role === 'admin';
    const isCreator = community.created_by === user.user_id;

    if (!isSiteAdmin && !isCreator) {
      return res.status(403).send('You are not allowed to delete this community.');
    }

    // Clean up related data (in case FK ON DELETE CASCADE isn't set)
    await db.none(
      `DELETE FROM post_likes
       WHERE post_id IN (SELECT post_id FROM posts WHERE community_id = $1)`,
      [communityId]
    );
    await db.none(
      `DELETE FROM posts WHERE community_id = $1`,
      [communityId]
    );
    await db.none(
      `DELETE FROM users_communities WHERE community_id = $1`,
      [communityId]
    );
    await db.none(
      `DELETE FROM communities WHERE community_id = $1`,
      [communityId]
    );

    return res.redirect('/communities');
  } catch (e) {
    console.log('POST /communities/:community_id/delete error:', e);
    return res.status(500).send('An error occurred while deleting the community.');
  }
});

// Handlebars
const hbs = handlebars.create({
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'views', 'partials'),
  helpers: {
    substring: (str, start, end) => {
      if (!str) return '';
      return str.substring(start, end);
    },
    formatDate: (date) => {
      if (!date) return '';

      // Handle date - could be Date object or string from PostgreSQL
      let d;
      if (date instanceof Date) {
        d = date;
      } else {
        // PostgreSQL TIMESTAMP - if no timezone, pg-promise may return as UTC
        // Ensure we parse it correctly
        const dateStr = date.toString();
        // If it's already a proper ISO string with timezone, use it
        // Otherwise, if it looks like ISO without timezone, treat as UTC
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) && !dateStr.includes('Z') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
          d = new Date(dateStr + 'Z'); // Append Z to treat as UTC
        } else {
          d = new Date(dateStr);
        }
      }

      // Convert to local timezone and format
      return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    },
    eq: (a, b) => {
      // Access user from template context via options.data.root
      // This works even inside {{#each}} loops
      return a === b;
    },
    getUserById: (id) => {
      return db.one('SELECT * FROM users WHERE user_id = $1', [id]);
    },
    likePost: (postId, userId) => {
      return db.none('INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)', [postId, userId]);
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
        error: 'Login failed: User not found. Register an account.',
        username
      });
    }

    // Compare plain text password with hashed password from database
    if (!user.password) {
      console.log('Login failed: User has no password:', username);
      return res.render('pages/login', {
        layout: 'main',
        error: 'Login failed: User has no password. Please reset your password.',
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

    // Create session with all user data including profile_picture
    // Compute full name for display
    const fullName = (user.first_name ? user.first_name : '') + (user.last_name ? (' ' + user.last_name) : '');
    const displayName = fullName.trim() || user.username;

    req.session.user = {
      username: user.username,
      user_id: user.user_id,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      profile_picture: user.profile_picture,
      name: displayName
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

  // Compute full name for display
  const fullName = (user.first_name ? user.first_name : '') + (user.last_name ? (' ' + user.last_name) : '');
  const displayName = fullName.trim() || user.username;

  req.session.user = {
    username: user.username,
    user_id: user.user_id,
    role: user.role || 'member',
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    profile_picture: user.profile_picture,
    name: displayName
  };
  await db.none('DELETE FROM verification_tokens WHERE token = $1', [token]);
  return res.redirect('/home');
});
// Register
app.get('/register', (req, res) => {
  res.render('pages/register', { layout: 'main' });
});

app.post('/register', async (req, res) => {
  try {
    // Check if request wants JSON (test) or HTML (browser)
    const acceptHeader = req.get('Accept') || '';
    const contentType = req.get('Content-Type') || '';
    const wantsJson = acceptHeader.includes('application/json') || contentType.includes('application/json');

    const { email, username, password } = req.body;
    console.log(email, username, password);

    // Validate input
    if (!email || !username || !password) {
      if (wantsJson) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      return res.status(400).render('pages/register', {
        layout: 'main',
        error: 'All fields are required',
        email,
        username
      });
    }

    const token = crypto.randomBytes(32).toString('hex');

    const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);
    if (user) {
      if (wantsJson) {
        console.log("In the testing part")
        return res.status(400).json({ error: 'Username already exists. Please try again.' });
      }
      console.log("In the rendering part")
      return res.status(400).render('pages/register', {
        layout: 'main',
        error: 'Username already exists. Please try again.',
        email,
        username
      });
    }

    console.log("After username check");
    const emailUser = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
    if (emailUser) {
      if (wantsJson) {
        return res.status(400).json({ message: 'Email already exists. Please try again.' });
      }
      return res.status(400).render('pages/register', {
        layout: 'main',
        error: 'Email already exists. Please try again.',
        email,
        username
      });
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
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        console.error('Email error details:', error.message, error.code);
      } else {
        console.log("Email sent successfully:", info.response);
      }
    });

    // Return appropriate response
    if (wantsJson) {
      return res.status(200).json({ message: 'Email sent. Please check your email for verification.' });
    }
    return res.status(200).render('pages/register', {
      layout: 'main',
      message: 'Email sent. Please check your email for verification.',
      email,
      username
    });
  } catch (error) {
    console.error('Register error:', error);

    const acceptHeader = req.get('Accept') || '';
    const contentType = req.get('Content-Type') || '';
    const wantsJson = acceptHeader.includes('application/json') || contentType.includes('application/json');

    if (wantsJson) {
      return res.status(500).json({ message: 'An error occurred during registration' });
    }
    return res.status(500).render('pages/register', {
      layout: 'main',
      error: 'An error occurred during registration',
      email: req.body.email,
      username: req.body.username
    });
  }
});

//logout
app.get('/logout', (req, res) => {
  console.log('Logged out user:', req.session.user.username);
  req.session.destroy();
  res.redirect('/login');
});

//get home (protected route)
app.get('/home', isAuthenticated, async (req, res) => {
  // Get the 3 most recent posts from communities the user is in
  const recentPosts = await db.any(
    `SELECT p.*, c.name as community_name
     FROM posts p
     INNER JOIN users_communities uc ON p.community_id = uc.community_id
     INNER JOIN communities c ON p.community_id = c.community_id
     WHERE uc.user_id = $1
     ORDER BY p.created_at DESC
     LIMIT 3`,
    [req.session.user.user_id]
  );

  res.render('pages/home', {
    layout: 'main',
    title: 'Home',
    user: req.session.user,
    recentPosts: recentPosts
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

    const acceptHeader = req.get('Accept') || '';
    const wantsJson = acceptHeader.includes('application/json') && !acceptHeader.includes('text/html');

    if (wantsJson) {
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
    const acceptHeader = req.get('Accept') || '';
    const wantsJson = acceptHeader.includes('application/json') && !acceptHeader.includes('text/html');

    if (wantsJson) {
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

app.get('/explore', isAuthenticated, async (req, res) => {
  const communities = await db.any(
    `SELECT c.*
     FROM communities c
     WHERE NOT EXISTS (
       SELECT 1
       FROM users_communities uc
       WHERE uc.community_id = c.community_id
         AND uc.user_id = $1
     )`,
    [req.session.user.user_id]
  );
  res.render('pages/explore', {
    layout: 'main',
    title: 'Explore',
    user: req.session.user,
    communities: communities
  });
});

app.post('/communities/:community_id/join', isAuthenticated, async (req, res) => {
  const communityId = parseInt(req.params.community_id, 10);
  if (Number.isNaN(communityId)) {
    return res.status(400).json({ error: 'Invalid community id' });
  }
  try {
    await db.none('INSERT INTO users_communities (user_id, community_id) VALUES ($1, $2)', [req.session.user.user_id, communityId]);
    return res.status(200).json({ success: true });
  } catch (e) {
    console.log('POST /communities/:community_id/join error:', e);
    return res.status(500).json({ success: false, error: 'Could not join community' });
  }
});

app.get('/communities', isAuthenticated, async (req, res) => {
  const communities = await db.any(
    `SELECT c.*
   FROM communities c
   JOIN users_communities uc ON uc.community_id = c.community_id
   WHERE uc.user_id = $1`,
    [req.session.user.user_id]
  );
  if (communities.length === 0) {
    return res.status(404).render('pages/communities', {
      layout: 'main',
      title: 'Communities',
      user: req.session.user,
      error: 'No communities found'
    });
  }
  res.render('pages/communities', {
    layout: 'main',
    title: 'Communities',
    user: req.session.user,
    communities: communities
  });
});

app.get('/communities/:community_id', isAuthenticated, async (req, res) => {
  const community = await db.one(
    `SELECT * FROM communities WHERE community_id = $1`,
    [req.params.community_id]
  );
  const posts = await db.any(
    `SELECT * FROM posts WHERE community_id = $1`,
    [req.params.community_id]
  );
  const postIds = posts.map(post => post.post_id);
  let likes = [];
  if (postIds.length > 0) {
    likes = await db.any(
      `SELECT post_id, COUNT(*) AS like_count
       FROM post_likes
       WHERE post_id = ANY($1::int[])
       GROUP BY post_id`,
      [postIds]
    );
  }
  for (const post of posts) {
    post.user = await db.one('SELECT * FROM users WHERE user_id = $1', [post.user_id]);
    post.likes = likes.find(like => like.post_id === post.post_id)?.like_count || 0;
  }
  res.render('pages/community', {
    layout: 'main',
    title: 'Community',
    community: community,
    user: req.session.user,
    posts: posts,
  });
});

app.post('/posts/:post_id/like', isAuthenticated, async (req, res) => {
  const postId = parseInt(req.params.post_id, 10);
  if (Number.isNaN(postId)) {
    return res.status(400).json({ error: 'Invalid post id' });
  }
  try {
    await db.none(
      `INSERT INTO post_likes (user_id, post_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, post_id) DO NOTHING`,
      [req.session.user.user_id, postId]
    );

    const { like_count } = await db.one(
      `SELECT COUNT(*)::int AS like_count FROM post_likes WHERE post_id = $1`,
      [postId]
    );

    return res.status(200).json({ likes: like_count });
  } catch (error) {
    console.log('POST /posts/:post_id/like error:', error);
    return res.status(500).json({ error: 'Could not like post' });
  }
});

app.post('/communities/save-description', isAuthenticated, async (req, res) => {
  const description = (req.body.description || '').trim();
  if (!description) {
    return res.status(400).render('pages/communities', {
      layout: 'main',
      title: 'Communities',
      communities: req.session.communities,
      user: req.session.user,
      error: 'Please fill in some description'
    });
  }
  try {
    await db.none('UPDATE communities SET description = $1 WHERE community_id = $2', [description, req.session.user.community_id]);
    return res.redirect('/communities?saved=1');
  } catch (e) {
    console.log('POST /save-description error:', e);
    return res.status(500).render('pages/communities', {
      layout: 'main',
      title: 'Communities',
      communities: req.session.communities,
      user: req.session.user,
      error: 'An error occurred while saving the description'
    });
  }
});

//profile page change password route
app.post('/communities/create-post', isAuthenticated, upload.single('post_image'), async (req, res) => {
  const postText = (req.body.post_text || '').trim();
  const communityId = (req.body.community_id || '').trim();

  if (!postText) {
    return res.status(400).render('pages/communities', {
      layout: 'main',
      title: 'Communities',
      communities: req.session.communities,
      user: req.session.user,
      error: 'Please fill in some post text'
    });
  }

  try {
    // Get image URL if file was uploaded
    let imageUrl = null;
    if (req.file) {
      // Generate URL path for the uploaded file
      imageUrl = `/uploads/${req.file.filename}`;
    }

    await db.none('INSERT INTO posts (text, user_id, community_id, image) VALUES ($1, $2, $3, $4)',
      [postText, req.session.user.user_id, communityId, imageUrl]);
    return res.redirect(`/communities/${communityId}?saved=1`);
  } catch (e) {
    console.log('POST /create-post error:', e);
    return res.status(500).render('pages/community', {
      layout: 'main',
      title: 'Community',
      community: req.session.community,
      user: req.session.user,
      error: 'An error occurred while creating the post'
    });
  }
});

app.post('/communities/:community_id/leave', isAuthenticated, async (req, res) => {
  const communityId = parseInt(req.params.community_id, 10);
  if (Number.isNaN(communityId)) {
    return res.status(400).json({ error: 'Invalid community id' });
  }
  try {
    await db.none('DELETE FROM users_communities WHERE user_id = $1 AND community_id = $2', [req.session.user.user_id, communityId]);
    return res.status(200).json({ success: true });
  } catch (e) {
    console.log('POST /communities/:community_id/leave error:', e);
    return res.status(500).json({ success: false, error: 'Could not leave community' });
  }
});

app.get('/activity', isAuthenticated, async (req, res) => {
  const activities = await db.any(
    `SELECT p.*, c.name as community_name
     FROM posts p
     INNER JOIN users_communities uc ON p.community_id = uc.community_id
     INNER JOIN communities c ON p.community_id = c.community_id
     WHERE uc.user_id = $1
     ORDER BY p.created_at DESC`,
    [req.session.user.user_id]
  );
  res.render('pages/activity', {
    layout: 'main',
    title: 'Activities',
    activities: activities,
    user: req.session.user
  });
});


app.get('/welcome', (req, res) => {
  res.json({ success: true, message: 'Welcome!' });
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