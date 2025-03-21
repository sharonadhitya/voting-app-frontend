// server.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Create Express app
const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'pollapp',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Optional auth middleware - doesn't require authentication but attaches user if token exists
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      req.user = verified;
    } catch (error) {
      // Invalid token, but we'll continue anyway
      req.user = null;
    }
  } else {
    req.user = null;
  }
  
  next();
};

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create polls table with user_id
    await pool.query(`
      CREATE TABLE IF NOT EXISTS polls (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description VARCHAR(500),
        is_private BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP NOT NULL,
        user_id INTEGER REFERENCES users(id)
      );
    `);

    // Create options table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS options (
        id SERIAL PRIMARY KEY,
        poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
        text VARCHAR(100) NOT NULL,
        votes INTEGER DEFAULT 0
      );
    `);

    // Create votes table to track who voted for what
    await pool.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
        option_id INTEGER REFERENCES options(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Run DB initialization
initializeDatabase();

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinPoll', (pollId) => {
    socket.join(pollId);
    console.log(`User ${socket.id} joined poll ${pollId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Helper function to get complete poll data
const getPollWithOptions = async (pollId, userId = null) => {
  const pollResult = await pool.query(
    'SELECT p.*, u.username as creator_username FROM polls p LEFT JOIN users u ON p.user_id = u.id WHERE p.id = $1',
    [pollId]
  );
  
  if (pollResult.rows.length === 0) {
    return null;
  }
  
  const poll = pollResult.rows[0];
  
  const optionsResult = await pool.query(
    'SELECT * FROM options WHERE poll_id = $1 ORDER BY id',
    [pollId]
  );
  
  poll.options = optionsResult.rows;
  
  // Check if the user has already voted
  if (userId) {
    const voteResult = await pool.query(
      'SELECT * FROM votes WHERE poll_id = $1 AND user_id = $2',
      [pollId, userId]
    );
    poll.userVoted = voteResult.rows.length > 0;
    
    if (poll.userVoted) {
      poll.userVotedOption = voteResult.rows[0].option_id;
    }
  } else {
    poll.userVoted = false;
  }
  
  // Check if the user is the creator
  poll.isCreator = userId && poll.user_id === userId;
  
  return poll;
};

// AUTH ROUTES

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if user already exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email, hashedPassword]
    );
    
    // Create token
    const token = jwt.sign(
      { id: newUser.rows[0].id, username: newUser.rows[0].username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      user: newUser.rows[0],
      token
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validation
    if (!username || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if user exists
    const user = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Create token
    const token = jwt.sign(
      { id: user.rows[0].id, username: user.rows[0].username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      user: {
        id: user.rows[0].id,
        username: user.rows[0].username,
        email: user.rows[0].email,
        created_at: user.rows[0].created_at
      },
      token
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
app.get('/api/auth/user', authenticateToken, async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POLL ROUTES

// Get all polls
app.get('/api/polls', optionalAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT p.*, u.username as creator_username FROM polls p LEFT JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC'
    );
    
    const polls = result.rows;
    
    // Get options for each poll
    for (const poll of polls) {
      const optionsResult = await pool.query(
        'SELECT * FROM options WHERE poll_id = $1',
        [poll.id]
      );
      
      poll.options = optionsResult.rows;
      
      // Check if the user has already voted on this poll
      if (req.user) {
        const voteResult = await pool.query(
          'SELECT * FROM votes WHERE poll_id = $1 AND user_id = $2',
          [poll.id, req.user.id]
        );
        poll.userVoted = voteResult.rows.length > 0;
        
        if (poll.userVoted) {
          poll.userVotedOption = voteResult.rows[0].option_id;
        }
      } else {
        poll.userVoted = false;
      }
      
      // Check if the user is the creator
      poll.isCreator = req.user && poll.user_id === req.user.id;
    }
    
    res.json(polls);
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific poll
app.get('/api/polls/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const poll = await getPollWithOptions(id, req.user ? req.user.id : null);
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    res.json(poll);
  } catch (error) {
    console.error('Error fetching poll:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new poll
app.post('/api/polls', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { title, description, options, end_date, is_private } = req.body;
    
    await client.query('BEGIN');
    
    // Insert poll with user_id
    const pollResult = await client.query(
      'INSERT INTO polls (title, description, end_date, is_private, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, end_date, is_private, req.user.id]
    );
    
    const poll = pollResult.rows[0];
    
    // Insert options
    for (const option of options) {
      await client.query(
        'INSERT INTO options (poll_id, text) VALUES ($1, $2)',
        [poll.id, option.text]
      );
    }
    
    await client.query('COMMIT');
    
    // Get creator's username
    const userResult = await pool.query(
      'SELECT username FROM users WHERE id = $1',
      [req.user.id]
    );
    
    // Get complete poll with options
    const completePoll = await getPollWithOptions(poll.id, req.user.id);
    completePoll.creator_username = userResult.rows[0].username;
    
    res.status(201).json(completePoll);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating poll:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Submit a vote
app.post('/api/polls/:id/vote', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { optionId } = req.body;
    
    // Check if poll exists
    const pollCheck = await client.query(
      'SELECT * FROM polls WHERE id = $1',
      [id]
    );
    
    if (pollCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    // Check if user is the creator
    if (pollCheck.rows[0].user_id === req.user.id) {
      return res.status(403).json({ error: 'You cannot vote on your own poll' });
    }
    
    // Check if poll has ended
    if (new Date(pollCheck.rows[0].end_date) < new Date()) {
      return res.status(403).json({ error: 'This poll has ended' });
    }
    
    // Check if user has already voted
    const voteCheck = await client.query(
      'SELECT * FROM votes WHERE poll_id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (voteCheck.rows.length > 0) {
      return res.status(403).json({ error: 'You have already voted on this poll' });
    }
    
    await client.query('BEGIN');
    
    // Record the vote
    await client.query(
      'INSERT INTO votes (poll_id, option_id, user_id) VALUES ($1, $2, $3)',
      [id, optionId, req.user.id]
    );
    
    // Increment vote count for the selected option
    await client.query(
      'UPDATE options SET votes = votes + 1 WHERE id = $1',
      [optionId]
    );
    
    await client.query('COMMIT');
    
    // Get updated poll data
    const updatedPoll = await getPollWithOptions(id, req.user.id);
    
    if (!updatedPoll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    // Emit update event to all clients viewing this poll
    io.to(id).emit('voteUpdate', updatedPoll);
    
    res.json(updatedPoll);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error submitting vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get polls created by the authenticated user
app.get('/api/user/polls', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM polls WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    
    const polls = result.rows;
    
    // Get options for each poll
    for (const poll of polls) {
      const optionsResult = await pool.query(
        'SELECT * FROM options WHERE poll_id = $1',
        [poll.id]
      );
      
      poll.options = optionsResult.rows;
      poll.isCreator = true;
    }
    
    res.json(polls);
  } catch (error) {
    console.error('Error fetching user polls:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
