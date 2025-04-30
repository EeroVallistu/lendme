const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// Database file path
const dbPath = path.resolve(__dirname, 'lendme.db');

// Initialize database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Initialize database schema
function init() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create users table if it doesn't exist
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('Error creating users table', err);
          return reject(err);
        }
        console.log('Users table initialized');
        resolve();
      });
    });
  });
}

// User operations
const user = {
  // Find user by email
  findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });
  },

  // Find user by ID
  findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT id, email, created_at FROM users WHERE id = ?', [id], (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });
  },

  // Create a new user
  async create(email, password) {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (email, password) VALUES (?, ?)',
        [email, hashedPassword],
        function(err) {
          if (err) {
            return reject(err);
          }
          resolve({ id: this.lastID, email });
        }
      );
    });
  },

  // Verify password
  async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password);
  }
};

module.exports = {
  init,
  user
};