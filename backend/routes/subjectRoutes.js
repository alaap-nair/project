const express = require("express");
const router = express.Router();
const Subject = require("../models/Subject");
const Task = require("../models/Task");
// Temporarily comment out auth middleware that's causing errors
// const auth = require("../middleware/auth");

// Get all subjects for a user
router.get("/", async (req, res) => {
  try {
    // Temporarily remove user filter to get all subjects
    const subjects = await Subject.find();
    res.json(subjects);
  } catch (err) {
    console.error("Error fetching subjects:", err.message);
    res.status(500).send("Server Error");
  }
});

// Get a specific subject
router.get("/:id", async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ msg: "Subject not found" });
    }

    // Temporarily remove user check
    // if (subject.user.toString() !== req.user.id) {
    //   return res.status(401).json({ msg: "Not authorized" });
    // }

    res.json(subject);
  } catch (err) {
    console.error("Error fetching subject:", err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Subject not found" });
    }
    res.status(500).send("Server Error");
  }
});

// Create a new subject
router.post("/", async (req, res) => {
  const { name, color } = req.body;

  // Validate input
  if (!name || !color) {
    return res.status(400).json({ msg: "Please provide both name and color" });
  }

  try {
    // Temporarily remove user check for existing subjects
    // const existingSubject = await Subject.findOne({ 
    //   user: req.user.id,
    //   name: name 
    // });

    // if (existingSubject) {
    //   return res.status(400).json({ msg: "A subject with this name already exists" });
    // }

    const newSubject = new Subject({
      name,
      color,
      // Don't set a user field at all since it's not required
    });

    const subject = await newSubject.save();
    res.json(subject);
  } catch (err) {
    console.error("Error creating subject:", err.message);
    res.status(500).send("Server Error");
  }
});

// Update a subject
router.put("/:id", async (req, res) => {
  const { name, color } = req.body;

  // Validate input
  if (!name || !color) {
    return res.status(400).json({ msg: "Please provide both name and color" });
  }

  try {
    let subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ msg: "Subject not found" });
    }

    // Temporarily remove user check
    // if (subject.user.toString() !== req.user.id) {
    //   return res.status(401).json({ msg: "Not authorized" });
    // }

    // Temporarily remove check for existing subjects with same name
    // if (name !== subject.name) {
    //   const existingSubject = await Subject.findOne({ 
    //     user: req.user.id,
    //     name: name 
    //   });

    //   if (existingSubject) {
    //     return res.status(400).json({ msg: "A subject with this name already exists" });
    //   }
    // }

    // Get the old name for updating tasks
    const oldName = subject.name;

    // Update subject
    subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { $set: { name, color } },
      { new: true }
    );

    // If name changed, update all tasks with this subject
    if (oldName !== name) {
      await Task.updateMany(
        { category: oldName },
        { $set: { category: name } }
      );
    }

    res.json(subject);
  } catch (err) {
    console.error("Error updating subject:", err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Subject not found" });
    }
    res.status(500).send("Server Error");
  }
});

// Delete a subject
router.delete("/:id", async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ msg: "Subject not found" });
    }

    // Temporarily remove user check
    // if (subject.user.toString() !== req.user.id) {
    //   return res.status(401).json({ msg: "Not authorized" });
    // }

    // Delete the subject
    await Subject.findByIdAndDelete(req.params.id);

    // Update tasks with this subject to "other" category
    await Task.updateMany(
      { category: subject.name },
      { $set: { category: "other" } }
    );

    res.json({ msg: "Subject removed" });
  } catch (err) {
    console.error("Error deleting subject:", err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Subject not found" });
    }
    res.status(500).send("Server Error");
  }
});

// Get tasks for a specific subject
router.get("/:id/tasks", async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ msg: "Subject not found" });
    }

    // Temporarily remove user check
    // if (subject.user.toString() !== req.user.id) {
    //   return res.status(401).json({ msg: "Not authorized" });
    // }

    const tasks = await Task.find({ 
      category: subject.name
    });

    res.json(tasks);
  } catch (err) {
    console.error("Error fetching subject tasks:", err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Subject not found" });
    }
    res.status(500).send("Server Error");
  }
});

module.exports = router; 