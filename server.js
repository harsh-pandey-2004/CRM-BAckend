const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const College = require('./CollegeModel');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Configure Cloudinary
cloudinary.config({
  cloud_name: "ddnlcnk4n",
  api_key: "926369151961374",
  api_secret: "SSAWvSK-VltUMpkthHvHR7VTPU8"
});

// Setup Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'colleges',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif']
  }
});

// Setup Multer with Cloudinary storage
const upload = multer({ storage: storage });

// Helper function to convert buffer to Cloudinary URL
const uploadBufferToCloudinary = async (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'colleges',
      ...options
    };

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    ).end(buffer);
  });
};

// Helper middleware to process data before saving
const processImagesInRequest = async (req, res, next) => {
  try {
    // Process the data object recursively
    async function processObject(obj) {
      if (!obj) return obj;

      // Process each key in the object
      for (const key in obj) {
        const value = obj[key];

        // Check if the value is a base64 data URL
        if (typeof value === 'string' && value.startsWith('data:image')) {
          // Convert data URL to buffer
          const match = value.match(/^data:image\/\w+;base64,(.+)$/);
          if (match) {
            const buffer = Buffer.from(match[1], 'base64');
            // Upload buffer to Cloudinary
            obj[key] = await uploadBufferToCloudinary(buffer);
          }
        }
        // Check if the value is a buffer or buffer-like object
        else if (typeof value === 'object' && value !== null) {
          // Check if the value might be a Buffer (has type property that includes "image" or is a Buffer instance)
          if ((value.type && value.type.includes('image')) || Buffer.isBuffer(value)) {
            const buffer = Buffer.isBuffer(value) ? value : value.data;
            // Upload buffer to Cloudinary
            obj[key] = await uploadBufferToCloudinary(buffer);
          }
          // Recursively process nested objects
          else if (typeof value === 'object') {
            await processObject(value);
          }
        }
      }
      return obj;
    }

    // Process the request body
    if (req.body) {
      await processObject(req.body);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Image upload routes
app.post('/api/images/upload', upload.single('image'), async (req, res) => {
  try {
    res.json({
      success: true,
      imageUrl: req.file.path
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: err.message
    });
  }
});

// Handle buffer uploads directly (without multer)
app.post('/api/images/upload-buffer', async (req, res) => {
  try {
    let imageData = req.body.image;
    let imageUrl;

    // Check if the image is a base64 string
    if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
      const match = imageData.match(/^data:image\/\w+;base64,(.+)$/);
      if (match) {
        const buffer = Buffer.from(match[1], 'base64');
        imageUrl = await uploadBufferToCloudinary(buffer);
      }
    }
    // Check if it's a buffer object
    else if (imageData && (Buffer.isBuffer(imageData) || imageData.type?.includes('image'))) {
      const buffer = Buffer.isBuffer(imageData) ? imageData : imageData.data;
      imageUrl = await uploadBufferToCloudinary(buffer);
    }

    if (!imageUrl) {
      throw new Error('Invalid image format');
    }

    res.json({
      success: true,
      imageUrl: imageUrl
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error uploading image buffer',
      error: err.message
    });
  }
});

// College routes
// Get all colleges
app.get('/api/colleges', async (req, res) => {
  try {
    const colleges = await College.find();
    res.json(colleges);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single college
app.get('/api/colleges/:name', async (req, res) => {
  try {
    const college = await College.find({ collegeName: req.params.name });
    if (!college) return res.status(404).json({ message: 'College not found' });
    res.json(college);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a college with automatic image processing
app.post('/api/colleges', processImagesInRequest, async (req, res) => {
  try {
    const collegeData = req.body;
    console.log(collegeData);

    const college = new College(collegeData);
    const savedCollege = await college.save();
    res.status(201).json(savedCollege);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Create a college with traditional image upload
app.post('/api/colleges/with-upload', upload.single('image'), async (req, res) => {
  try {
    const collegeData = req.body;

    if (req.file) {
      collegeData.imageUrl = req.file.path;
    }

    console.log(collegeData);
    const college = new College(collegeData);
    const savedCollege = await college.save();
    res.status(201).json(savedCollege);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a college with automatic image processing
app.put('/api/colleges/:id', processImagesInRequest, async (req, res) => {
  try {
    const collegeData = req.body;

    const college = await College.findByIdAndUpdate(
      req.params.id,
      collegeData,
      { new: true }
    );
    if (!college) return res.status(404).json({ message: 'College not found' });
    res.json(college);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a college with traditional image upload
app.put('/api/colleges/:id/with-upload', upload.single('image'), async (req, res) => {
  try {
    const collegeData = req.body;

    // If there's an uploaded image, add its URL to the college data
    if (req.file) {
      collegeData.imageUrl = req.file.path;
    }

    const college = await College.findByIdAndUpdate(
      req.params.id,
      collegeData,
      { new: true }
    );
    if (!college) return res.status(404).json({ message: 'College not found' });
    res.json(college);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a college
app.delete('/api/colleges/:id', async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) return res.status(404).json({ message: 'College not found' });

    // If the college has an image, delete it from Cloudinary
    if (college.imageUrl) {
      try {
        // Extract the public_id from the URL
        const urlParts = college.imageUrl.split('/');
        const filename = urlParts[urlParts.length - 1].split('.')[0];
        const folder = urlParts[urlParts.length - 2];
        const publicId = `${folder}/${filename}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error('Error deleting image from Cloudinary:', cloudinaryError);
      }
    }

    await College.findByIdAndDelete(req.params.id);
    res.json({ message: 'College deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: err.message
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});