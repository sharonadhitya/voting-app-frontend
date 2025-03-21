const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { Pool } = require("pg");
require("dotenv").config();

const router = express.Router();

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// User Signup
router.post(
  "/signup",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("email").isEmail().withMessage("Invalid email"),
    body("password").isLength({ min: 6 }).withMessage("Password too short"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, email, password } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await pool.query(
        "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email",
        [username, email, hashedPassword]
      );

      res.json({ message: "User registered successfully", user: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// User Login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Invalid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

      if (userResult.rows.length === 0) {
        return res.status(400).json({ error: "User not found" });
      }

      const user = userResult.rows[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

      const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      res.json({ message: "Login successful", token });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;

