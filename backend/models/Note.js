const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  audioUrl: {
    type: String
  },
  transcript: {
    type: String
  },
  subjectId: {
    type: String
  },
  taskIds: [{
    type: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model("Note", noteSchema);
