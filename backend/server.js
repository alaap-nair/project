require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
app.use(express.json());
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
  credentials: false,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ✅ Import Routes
const noteRoutes = require("./routes/noteRoutes");
const subjectRoutes = require('./routes/subjectRoutes');
const transcriptionRoutes = require("./routes/transcriptionRoutes");
const taskRoutes = require("./routes/taskRoutes");

// Check if userRoutes exists before importing
let userRoutes;
try {
  userRoutes = require('./routes/userRoutes');
} catch (error) {
  console.warn("⚠️ userRoutes not found, user functionality will be limited");
}

// ✅ Connect to MongoDB (Fixed Deprecation Warnings)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err);
    console.log("⚠️ Application will continue but database functionality will be limited");
  });

// ✅ Use Routes
app.use("/api/notes", noteRoutes); // Links all note-related routes
app.use('/api/subjects', subjectRoutes);
app.use("/api", transcriptionRoutes);
app.use("/api/tasks", taskRoutes);

// Only use userRoutes if it was successfully imported
if (userRoutes) {
  app.use('/api/users', userRoutes);
}

// ✅ Test Route
app.get("/", (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// Get local IP addresses for debugging
const getLocalIpAddresses = () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const interfaceName in interfaces) {
    const interfaceInfo = interfaces[interfaceName];
    for (const info of interfaceInfo) {
      // Skip internal and non-IPv4 addresses
      if (info.family === 'IPv4' && !info.internal) {
        addresses.push(info.address);
      }
    }
  }
  
  return addresses;
};

// ✅ Port Handling (Solves 'Address in Use' Error)
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  const localIps = getLocalIpAddresses();
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Local server URL: http://localhost:${PORT}`);
  
  if (localIps.length > 0) {
    console.log('🌐 Available on your network at:');
    localIps.forEach(ip => {
      console.log(`   http://${ip}:${PORT}`);
    });
    console.log('👉 Use one of these URLs in your config.ts for physical devices');
  }
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Try a different port.`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('👋 Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});
