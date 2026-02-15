const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const Data = require('../models/Data');

const app = express();

// ------------------ CORS FIX ------------------
app.use(cors({
  origin: [
    'https://newfoldre-frontend.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());

// ------------------ MONGODB CACHE FIX ------------------
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

connectDB();

// ------------------ ROUTES ------------------

app.post('/api/data', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const newData = new Data({
      content: content.trim()
    });

    await newData.save();

    res.status(201).json({
      success: true,
      message: 'Data saved successfully',
      data: newData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

app.get('/api/data', async (req, res) => {
  try {
    const allData = await Data.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: allData.length,
      data: allData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'Data Manager API',
    status: 'Running on Vercel',
    version: '1.0.0'
  });
});

module.exports = app;
