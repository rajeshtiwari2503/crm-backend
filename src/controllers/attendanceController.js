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
    const { userId, user } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const attendance = await Attendance.findOne({ userId, user, date: today });
    if (!attendance) return res.status(404).json({ message: 'Attendance not found' });

    attendance.clockOut = new Date();

    const diffMs = attendance.clockOut - attendance.clockIn;
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    attendance.totalHours = `${hours} hrs ${minutes} mins`;
    attendance.totalHoursDecimal = parseFloat((totalMinutes / 60).toFixed(2)); // Optional: keep this for reports

    await attendance.save();
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


 
// const getMonthlyAttendance = async (req, res) => {
//   try {
//     const now = new Date();
//     const start = new Date(now.getFullYear() - 2, 0, 1); // from Jan two years ago

//     const attendanceData = await Attendance.aggregate([
//       {
//         $match: {
//           date: { $gte: start, $lte: now }
//         }
//       },
//       {
//         $addFields: {
//           day: { $dayOfMonth: "$date" },
//           month: { $month: "$date" },
//           year: { $year: "$date" }
//         }
//       },
//       {
//         $group: {
//           _id: {
//             year: "$year",
//             month: "$month",
//             day: "$day"
//           },
//           records: { $push: "$$ROOT" },
//           totalEntries: { $sum: 1 }
//         }
//       },
//       {
//         $sort: {
//           "_id.year": 1,
//           "_id.month": 1,
//           "_id.day": 1
//         }
//       }
//     ]);

//     const monthNames = [
//       "January", "February", "March", "April", "May", "June",
//       "July", "August", "September", "October", "November", "December"
//     ];

//     // Group days under months
//     const groupedByMonth = {};

//     for (const item of attendanceData) {
//       const { year, month, day } = item._id;
//       const monthYearLabel = `${monthNames[month - 1]} ${year}`;

//       if (!groupedByMonth[monthYearLabel]) {
//         groupedByMonth[monthYearLabel] = {
//           monthYear: monthYearLabel,
//           totalEntries: 0,
//           days: []
//         };
//       }

//       groupedByMonth[monthYearLabel].days.push({
//         date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
//         totalEntries: item.totalEntries,
//         records: item.records
//       });

//       groupedByMonth[monthYearLabel].totalEntries += item.totalEntries;
//     }

//     const formattedData = Object.values(groupedByMonth);

//     res.status(200).json(formattedData);
//   } catch (err) {
//     console.error("Error fetching monthly attendance:", err);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

const getMonthlyAttendance = async (req, res) => {
  try {
    const { month } = req.query; // e.g., "2024-06"

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: "Invalid or missing 'month' parameter" });
    }

    const [year, monthIndex] = month.split('-').map(Number);
    const start = new Date(year, monthIndex - 1, 1);
    const end = new Date(year, monthIndex, 0, 23, 59, 59, 999);

    const attendanceData = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end }
        }
      },
      {
        $addFields: {
          day: { $dayOfMonth: "$date" },
          month: { $month: "$date" },
          year: { $year: "$date" }
        }
      },
      {
        $group: {
          _id: {
            year: "$year",
            month: "$month",
            day: "$day"
          },
          records: { $push: "$$ROOT" },
          totalEntries: { $sum: 1 }
        }
      },
      {
        $sort: {
          "_id.year": -1,
          "_id.month": -1,
          "_id.day": -1
        }
      }
    ]);

    const monthLabel = new Date(year, monthIndex - 1).toLocaleString('default', {
      month: 'long',
      year: 'numeric'
    });

    const groupedByMonth = {
      monthYear: monthLabel,
      totalEntries: 0,
      days: []
    };

    for (const item of attendanceData) {
      const { year, month, day } = item._id;
      groupedByMonth.days.push({
        date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        totalEntries: item.totalEntries,
        records: item.records
      });
      groupedByMonth.totalEntries += item.totalEntries;
    }

    // Optional: Sort the days array again if needed
    groupedByMonth.days.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json([groupedByMonth]);
  } catch (err) {
    console.error("Error fetching monthly attendance:", err);
    res.status(500).json({ message: "Server Error" });
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

module.exports = { clockIn, clockOut ,getTodayStatus,getMonthlyAttendance,getDailyAttendance,assignTask, startTask, pauseTask, completeTask  };