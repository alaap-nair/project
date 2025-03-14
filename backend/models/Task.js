const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['study', 'homework', 'exam', 'project', 'other'],
    default: 'other'
  },
  deadline: {
    type: Date,
    required: true
  },
  reminderTime: {
    type: Number,
    default: 0 // Minutes before deadline
  },
  notificationId: {
    type: String,
    default: null
  },
  calendarEventId: {
    type: String,
    default: null
  },
  noteIds: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
taskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Task', taskSchema); 