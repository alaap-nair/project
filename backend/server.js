require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');

const app = express();

// Increase the limit for JSON and URL-encoded bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure CORS to accept requests from mobile devices
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
  credentials: false,
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Content-Disposition']
}));

// Ensure uploads directory exists and is writable
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
// Set proper permissions for uploads directory
fs.chmodSync(uploadsDir, 0o755);

// Import Routes
const transcriptionRoutes = require("./routes/transcriptionRoutes");

// Use Routes
app.use("/api", transcriptionRoutes);

// Test Route
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
      if (info.family === 'IPv4' && !info.internal) {
        addresses.push(info.address);
      }
    }
  }
  
  return addresses;
};

// Function to check if a port is in use
const isPortInUse = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', () => resolve(true))
      .once('listening', () => {
        server.close();
        resolve(false);
      })
      .listen(port);
  });
};

// Function to find an available port
const findAvailablePort = async (startPort) => {
  let port = startPort;
  while (await isPortInUse(port)) {
    port++;
  }
  return port;
};

// Port Handling
const startServer = async () => {
  try {
    const PORT = 8003; // Force port 8003
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      const localIps = getLocalIpAddresses();
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Local server URL: http://localhost:${PORT}`);
      
      if (localIps.length > 0) {
        console.log('🌐 Available on your network at:');
        localIps.forEach(ip => {
          console.log(`   http://${ip}:${PORT}`);
        });
      }
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please kill any existing processes using this port.`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
