const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { equipment } = require('../db/database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/equipment');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// File filter to only allow image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, JPG and PNG image files are allowed'));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 3 // max 3 files
  }
});

// Middleware to authenticate user
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Create new equipment
router.post('/', authenticateToken, upload.array('images', 3), async (req, res) => {
  try {
    const { 
      name, 
      category, 
      modelNumber, 
      serialNumber, 
      description, 
      condition, 
      location, 
      maintenanceSchedule, 
      notes 
    } = req.body;
    
    // Validate required fields
    if (!name || !category || !modelNumber || !serialNumber || !condition || !location) {
      return res.status(400).json({ 
        message: 'Required fields missing: name, category, modelNumber, serialNumber, condition, and location are required' 
      });
    }
    
    // Check if serial number is unique
    const existingEquipment = await equipment.findBySerialNumber(serialNumber);
    if (existingEquipment) {
      return res.status(409).json({ message: 'An equipment item with this serial number already exists' });
    }
    
    // Create equipment in database
    const equipmentData = {
      name,
      category,
      modelNumber,
      serialNumber,
      description,
      condition,
      location,
      maintenanceSchedule,
      notes
    };
    
    const newEquipment = await equipment.create(equipmentData, req.userId);
    
    // Handle image uploads if any
    const imagePaths = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const relativePath = path.relative(path.join(__dirname, '..'), file.path);
        await equipment.addImage(newEquipment.id, relativePath);
        imagePaths.push(relativePath);
      }
    }
    
    res.status(201).json({
      message: 'Equipment added successfully',
      equipment: { ...newEquipment, images: imagePaths }
    });
  } catch (error) {
    console.error('Equipment creation error:', error);
    res.status(500).json({ message: 'Failed to add equipment' });
  }
});

// Get all equipment for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await equipment.getAllForUser(req.userId);
    res.json({ equipment: items });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ message: 'Failed to fetch equipment' });
  }
});

module.exports = router;