const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('./cloudinaryConfig');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'college-crm',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 1000, crop: 'limit' }]
  }
});

// Set up multer with Cloudinary storage
const upload = multer({ storage });

// Route for single image upload
router.post('/upload/single', upload.single('image'), (req, res) => {
  try {
    return res.status(200).json({
      url: req.file.path,
      public_id: req.file.filename
    });
  } catch (error) {
    console.error('Upload failed:', error);
    return res.status(500).json({
      message: 'Upload failed',
      error: error.message
    });
  }
});

// Route for multiple image uploads
router.post('/upload/multiple', upload.array('images', 10), (req, res) => {
  try {
    const uploadedFiles = req.files.map(file => ({
      url: file.path,
      public_id: file.filename
    }));
    
    return res.status(200).json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Multiple upload failed:', error);
    return res.status(500).json({
      message: 'Multiple upload failed',
      error: error.message
    });
  }
});

module.exports = router;