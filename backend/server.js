require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Import Routes
const noteRoutes = require("./routes/noteRoutes");
const subjectRoutes = require('./routes/subjectRoutes');
const transcriptionRoutes = require("./routes/transcriptionRoutes");

// ✅ Connect to MongoDB (Fixed Deprecation Warnings)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Use Routes
app.use("/api/notes", noteRoutes); // Links all note-related routes
app.use('/api/subjects', subjectRoutes);
app.use("/api", transcriptionRoutes);

// ✅ Test Route
app.get("/", (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// ✅ Port Handling (Solves 'Address in Use' Error)
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
