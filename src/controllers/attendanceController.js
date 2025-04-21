const {Attendance,Task} = require('../models/attendanceModel');
 

// === Attendance Controller ===

 const clockIn = async (req, res) => {
  try {
    const { userId,user } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const existing = await Attendance.findOne({ userId, date: today });
    if (existing) return res.status(400).json({ message: 'Already clocked in today' });

    const attendance = new Attendance({
      userId,
      user,
      date: today,
      clockIn: new Date()
    });

    await attendance.save();
    res.status(201).json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const clockOut = async (req, res) => {
  try {
    const { userId ,user} = req.body;
    const today = new Date().toISOString().split('T')[0];

    const attendance = await Attendance.findOne({ userId,user, date: today });
    if (!attendance) return res.status(404).json({ message: 'Attendance not found' });

    attendance.clockOut = new Date();
    const hoursWorked = (attendance.clockOut - attendance.clockIn) / (1000 * 60 * 60);
    attendance.totalHours = parseFloat(hoursWorked.toFixed(2));

    await attendance.save();
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const getDailyAttendance = async (req, res) => {
  const { date } = req.query;
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  try {
    const records = await Attendance.find({
      date: { $gte: start, $lte: end },
    }).populate('userId', 'user');

    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};



  const getTodayStatus = async (req, res) => {
    const userId = req.params.id;
    console.log("Checking status for user:", userId);
  
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
  
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
  
    try {
      const record = await Attendance.findOne({
        userId,
        date: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
      });
  
      if (!record) {
        return res.json({}); // No attendance record for today
      }
  
      res.json({
        clockIn: record.clockIn,
        clockOut: record.clockOut,
      });
    } catch (error) {
      console.error("Error fetching today's status:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  
// === Task Controller ===

const assignTask = async (req, res) => {
  try {
    const { taskTitle, description, assignedTo, assignedBy } = req.body;

    const task = new Task({
      taskTitle,
      description,
      assignedTo,
      assignedBy
    });

    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const startTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.startTime = new Date();
    task.status = 'In Progress';

    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const pauseTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const now = new Date();
    task.timeSpent = ((now - task.startTime) / (1000 * 60)); // in minutes
    task.status = 'Paused';

    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const completeTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const now = new Date();
    task.endTime = now;
    task.status = 'Completed';
    task.timeSpent = ((now - task.startTime) / (1000 * 60)); // in minutes

    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { clockIn, clockOut ,getTodayStatus,getDailyAttendance,assignTask, startTask, pauseTask, completeTask  };