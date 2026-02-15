const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Data = require('./models/Data');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
  ],
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/datamanager');
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.log('❌ MongoDB Connection Error:', error.message);
  }
};

connectDB();

// Routes
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
    console.error('Save Error:', error);
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
    console.error('Fetch Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Data Manager API',
    status: 'Running',
    endpoints: {
      addData: 'POST /api/data',
      fetchData: 'GET /api/data'
    },
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    version: '1.0.0'
  });
});

// Health check
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    uptime: process.uptime()
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// For Vercel, we need to export the app
module.exports = app;

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}