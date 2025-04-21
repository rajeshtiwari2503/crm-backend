const mongoose = require('mongoose');

// Break Schema
const breakSchema = new mongoose.Schema({
  start: Date,
  end: Date
});

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId,   required: true },
  user:{type:String},
  date: { type: Date, required: true },
  clockIn: Date,
  clockOut: Date,
  breaks: [breakSchema],
  totalHours: Number,
  leaveRequested: { type: Boolean, default: false }
});

// Task Schema
const taskSchema = new mongoose.Schema({
  taskTitle: String,
  description: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startTime: Date,
  endTime: Date,
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Paused', 'Completed'],
    default: 'Not Started'
  },
  timeSpent: Number,
  notes: [{ message: String, time: Date }],
  date: { type: Date, default: Date.now }
});

// Export both models
 
const Attendance = mongoose.model('Attendance', attendanceSchema);
const Task = mongoose.model('Task', taskSchema);

module.exports = {
    Attendance,
    Task ,
};
