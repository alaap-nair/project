const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new task
router.post('/', async (req, res) => {
  const task = new Task({
    title: req.body.title,
    description: req.body.description,
    completed: req.body.completed || false,
    priority: req.body.priority || 'medium',
    category: req.body.category || 'other',
    deadline: req.body.deadline,
    reminderTime: req.body.reminderTime || 0,
    notificationId: req.body.notificationId || null,
    calendarEventId: req.body.calendarEventId || null,
    noteIds: req.body.noteIds || []
  });

  try {
    const newTask = await task.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a task
router.patch('/:id', async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!updatedTask) return res.status(404).json({ message: 'Task not found' });
    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate AI summary of tasks
router.post('/summarize', async (req, res) => {
  try {
    // Get filter parameters from request body
    const { category, priority, completed, timeframe } = req.body;
    
    // Build query based on filters
    let query = {};
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (completed !== undefined) query.completed = completed;
    
    // Add timeframe filter if provided
    if (timeframe) {
      const now = new Date();
      let startDate;
      
      switch(timeframe) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        query.deadline = { $gte: startDate.toISOString() };
      }
    }
    
    // Fetch tasks based on query
    const tasks = await Task.find(query).sort({ deadline: 1 });
    
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'No tasks found matching the criteria' });
    }
    
    // Generate summary
    const summary = generateTaskSummary(tasks);
    
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to generate task summary
function generateTaskSummary(tasks) {
  // Count tasks by priority
  const priorityCounts = {
    high: tasks.filter(task => task.priority === 'high').length,
    medium: tasks.filter(task => task.priority === 'medium').length,
    low: tasks.filter(task => task.priority === 'low').length
  };
  
  // Count tasks by category
  const categoryCounts = {};
  tasks.forEach(task => {
    categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
  });
  
  // Count completed vs incomplete
  const completedCount = tasks.filter(task => task.completed).length;
  const incompleteCount = tasks.length - completedCount;
  
  // Find upcoming deadlines (next 3 days)
  const now = new Date();
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(now.getDate() + 3);
  
  const upcomingDeadlines = tasks
    .filter(task => !task.completed && new Date(task.deadline) <= threeDaysFromNow)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);
  
  // Generate summary text
  let summaryText = `You have ${tasks.length} tasks in total: ${completedCount} completed and ${incompleteCount} pending. `;
  
  // Add priority breakdown
  summaryText += `By priority: ${priorityCounts.high} high, ${priorityCounts.medium} medium, and ${priorityCounts.low} low priority tasks. `;
  
  // Add category breakdown for top 3 categories
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  if (topCategories.length > 0) {
    summaryText += `Most common categories: `;
    topCategories.forEach(([category, count], index) => {
      summaryText += `${category} (${count})`;
      if (index < topCategories.length - 1) summaryText += ', ';
    });
    summaryText += '. ';
  }
  
  // Add upcoming deadlines
  if (upcomingDeadlines.length > 0) {
    summaryText += `Upcoming deadlines: `;
    upcomingDeadlines.forEach((task, index) => {
      const dueDate = new Date(task.deadline);
      const formattedDate = `${dueDate.getMonth() + 1}/${dueDate.getDate()}/${dueDate.getFullYear()}`;
      summaryText += `"${task.title}" (${formattedDate})`;
      if (index < upcomingDeadlines.length - 1) summaryText += ', ';
    });
    summaryText += '.';
  }
  
  return summaryText;
}

module.exports = router; 