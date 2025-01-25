const express = require('express');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const dotenv = require('dotenv');

// Initialize environment variables
dotenv.config();

// Constants
const dbPath = path.join(__dirname, 'crm.db');
const app = express();
app.use(express.json());

let db = null;

// Initialize Database and Server
const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });

    // Create necessary tables if they don't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'user'
      );

      CREATE TABLE IF NOT EXISTS customer (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        company TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES user (id)
      );
    `);

    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/');
    });
  } catch (e) {
    console.error(`DB Error: ${e.message}`);
    process.exit(-1);
  }
};
initializeDBAndServer();

// Middleware for JWT Authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token is missing or invalid' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Middleware for Role-Based Access Control
const authorizeRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

// User Registration
app.post(
  '/register',
  body('username').isString().notEmpty(),
  body('password').isLength({ min: 8 }),
  async (req, res) => {
    const { username, password, role = 'user' } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const query = `
        INSERT INTO user (username, password, role)
        VALUES (?, ?, ?)
      `;
      await db.run(query, [username, hashedPassword, role]);
      res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        res.status(400).json({ error: 'Username already exists' });
      } else {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  }
);

// User Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const query = `SELECT * FROM user WHERE username = ?`;
    const user = await db.get(query, [username]);

    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create Customer
app.post(
  '/customers',
  authenticateToken,
  body('name').isString().notEmpty(),
  body('email').isEmail(),
  body('phone').isString().notEmpty(),
  async (req, res) => {
    const { name, email, phone, company } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const query = `
        INSERT INTO customer (name, email, phone, company, user_id)
        VALUES (?, ?, ?, ?, ?)
      `;
      await db.run(query, [name, email, phone, company, req.user.id]);
      res.status(201).json({ message: 'Customer created successfully' });
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        res.status(400).json({ error: 'Email already exists' });
      } else {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  }
);

// Get All Customers with Search and Filtering
app.get('/customers', authenticateToken, async (req, res) => {
  const { search = '', company = '' } = req.query;

  try {
    const query = `
      SELECT * FROM customer
      WHERE user_id = ?
      AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)
      AND company LIKE ?
      ORDER BY created_at DESC
    `;
    const customers = await db.all(query, [
      req.user.id,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${company}%`,
    ]);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update Customer
app.put(
  '/customers/:id',
  authenticateToken,
  body('name').optional().isString().notEmpty(),
  body('email').optional().isEmail(),
  body('phone').optional().isString().notEmpty(),
  async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, company } = req.body;

    try {
      const updateQuery = `
        UPDATE customer
        SET name = COALESCE(?, name),
            email = COALESCE(?, email),
            phone = COALESCE(?, phone),
            company = COALESCE(?, company),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `;
      const result = await db.run(updateQuery, [
        name,
        email,
        phone,
        company,
        id,
        req.user.id,
      ]);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      res.json({ message: 'Customer updated successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// Delete Customer
app.delete('/customers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const deleteQuery = `
      DELETE FROM customer
      WHERE id = ? AND user_id = ?
    `;
    const result = await db.run(deleteQuery, [id, req.user.id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = app;
