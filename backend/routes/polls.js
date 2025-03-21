const express = require("express");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const router = express.Router();
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Middleware to verify JWT token
const authenticate = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Create Poll
router.post("/create", authenticate, async (req, res) => {
  const { question, options } = req.body;

  if (!question || !options || options.length < 2) {
    return res.status(400).json({ error: "Invalid poll data" });
  }

  try {
    const pollResult = await pool.query(
      "INSERT INTO polls (question, user_id) VALUES ($1, $2) RETURNING id",
      [question, req.user.userId]
    );

    const pollId = pollResult.rows[0].id;
    options.forEach(async (option) => {
      await pool.query("INSERT INTO poll_options (poll_id, option_text) VALUES ($1, $2)", [
        pollId,
        option,
      ]);
    });

    res.json({ message: "Poll created successfully", pollId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vote in a Poll
router.post("/vote", authenticate, async (req, res) => {
  const { pollId, optionId } = req.body;

  try {
    // Ensure user didn't create the poll
    const pollResult = await pool.query("SELECT user_id FROM polls WHERE id = $1", [pollId]);
    if (pollResult.rows[0].user_id === req.user.userId) {
      return res.status(403).json({ error: "You cannot vote on your own poll" });
    }

    // Ensure user hasn't already voted
    const voteCheck = await pool.query("SELECT * FROM votes WHERE poll_id = $1 AND user_id = $2", [
      pollId,
      req.user.userId,
    ]);

    if (voteCheck.rows.length > 0) {
      return res.status(400).json({ error: "You have already voted in this poll" });
    }

    // Register vote
    await pool.query("INSERT INTO votes (poll_id, option_id, user_id) VALUES ($1, $2, $3)", [
      pollId,
      optionId,
      req.user.userId,
    ]);

    res.json({ message: "Vote recorded successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

