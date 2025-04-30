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
        
        // Create equipment table
        db.run(`CREATE TABLE IF NOT EXISTS equipment (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          model_number TEXT NOT NULL,
          serial_number TEXT NOT NULL UNIQUE,
          description TEXT,
          condition TEXT NOT NULL,
          location TEXT NOT NULL,
          maintenance_schedule TEXT,
          notes TEXT,
          user_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )`, (err) => {
          if (err) {
            console.error('Error creating equipment table', err);
            return reject(err);
          }
          console.log('Equipment table initialized');
          
          // Create equipment_images table
          db.run(`CREATE TABLE IF NOT EXISTS equipment_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            equipment_id INTEGER NOT NULL,
            image_path TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
          )`, (err) => {
            if (err) {
              console.error('Error creating equipment_images table', err);
              return reject(err);
            }
            console.log('Equipment images table initialized');
            resolve();
          });
        });
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

// Equipment operations
const equipment = {
  // Create a new equipment item
  create(equipmentData, userId) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO equipment (
          name, category, model_number, serial_number, 
          description, condition, location, 
          maintenance_schedule, notes, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          equipmentData.name,
          equipmentData.category,
          equipmentData.modelNumber,
          equipmentData.serialNumber,
          equipmentData.description || null,
          equipmentData.condition,
          equipmentData.location,
          equipmentData.maintenanceSchedule || null,
          equipmentData.notes || null,
          userId
        ],
        function(err) {
          if (err) {
            return reject(err);
          }
          resolve({ id: this.lastID, ...equipmentData });
        }
      );
    });
  },

  // Add images for an equipment item
  addImage(equipmentId, imagePath) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO equipment_images (equipment_id, image_path) VALUES (?, ?)',
        [equipmentId, imagePath],
        function(err) {
          if (err) {
            return reject(err);
          }
          resolve({ id: this.lastID, equipmentId, imagePath });
        }
      );
    });
  },

  // Get all equipment for a user
  getAllForUser(userId) {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM equipment WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  },

  // Get equipment by serial number to check uniqueness
  findBySerialNumber(serialNumber) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM equipment WHERE serial_number = ?', [serialNumber], (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });
  }
};

module.exports = {
  init,
  user,
  equipment
};