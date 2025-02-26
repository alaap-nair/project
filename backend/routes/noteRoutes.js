const express = require("express");
const router = express.Router();
const Note = require("../models/Note");

// ✅ Get All Notes
router.get("/", async (req, res) => {
  try {
    const notes = await Note.find();
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Create a New Note (Ensure `updatedAt` is Always Set)
router.post("/", async (req, res) => {
  try {
    const newNote = new Note({
      ...req.body,
      updatedAt: new Date(), // ✅ Fix for Invalid Time Value Error
    });
    await newNote.save();
    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Update an Existing Note
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedNote = await Note.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() }, // ✅ Update Timestamp
      { new: true }
    );
    if (!updatedNote) {
      return res.status(404).json({ message: "Note not found" });
    }
    res.json(updatedNote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Delete a Note
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedNote = await Note.findByIdAndDelete(id);
    if (!deletedNote) {
      return res.status(404).json({ message: "Note not found" });
    }
    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
