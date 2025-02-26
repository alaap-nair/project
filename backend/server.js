require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Import Routes
const noteRoutes = require("./routes/noteRoutes");

// ✅ Connect to MongoDB (Fixed Deprecation Warnings)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Use Routes
app.use("/api/notes", noteRoutes); // Links all note-related routes

// ✅ Test Route
app.get("/", (req, res) => {
  res.send("Backend is running and connected to MongoDB!");
});

// ✅ Port Handling (Solves 'Address in Use' Error)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
