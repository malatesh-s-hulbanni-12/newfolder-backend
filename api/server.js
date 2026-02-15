const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const Data = require('../models/Data');

const app = express();

/* ================== CORS CONFIG ================== */
const allowedOrigins = [
  'http://localhost:5173', // local frontend (Vite)
  'http://localhost:3000', // local React
  'https://newfoldre-frontend.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());

/* ================== MONGODB CONNECTION CACHE ================== */

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

/* ================== ROUTES ================== */

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
    console.error("POST Error:", error);
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
    console.error("GET Error:", error);
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

/* ================== EXPORT ================== */
module.exports = app;
