const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: false
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("subject", SubjectSchema); 