const {Attendance,Task} = require('../models/attendanceModel');
 const {  EmployeeModel } = require('../models/registration');
const mongoose = require('mongoose');


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
    res.status(201).json({status:true,msg:"Checkout Successfully",attendance});
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
    res.json({status:true,msg:"Checkout Successfully",attendance});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT: /api/attendance/comment/:userId
 const addDailyComment= async (req, res) => {
 
  const { date,userId ,taskComment } = req.body;
// console.log("req.body",req.body);

  if (!taskComment || taskComment.trim() === '') {
    return res.status(400).json({ message: 'Comment is required' });
  }

  const today = date ? new Date(date) : new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const attendance = await Attendance.findOne({
    userId,
    date: { $gte: startOfDay, $lte: endOfDay }
  });

  if (!attendance) {
    return res.status(404).json({ message: 'Attendance record not found for today' });
  }

  attendance.taskComment = taskComment.trim();
  await attendance.save();

  res.json({ status:true,msg: 'Task comment added successfully', taskComment: attendance.taskComment });
};

 
 
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



  const getMonthlyAttendanceByUserId = async (req, res) => {
  try {
    const { month, userId } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: "Invalid or missing 'month' parameter" });
    }

    if (!userId) {
      return res.status(400).json({ message: "Missing 'userId' parameter" });
    }

    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999));

    const attendanceData = await Attendance.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId), // ✅ FIXED: cast to ObjectId
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

    const monthLabel = new Date(start).toLocaleString('default', {
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


const getDailyAttendanceByUserId = async (req, res) => {
  const { date, userId } = req.query;

  if (!date) {
    return res.status(400).json({ message: "Missing 'date' parameter" });
  }

  if (!userId) {
    return res.status(400).json({ message: "Missing 'userId' parameter" });
  }

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  try {
    const records = await Attendance.find({
      userId: userId,
      date: { $gte: start, $lte: end },
    }).populate('userId', 'user');

    res.json(records);
  } catch (err) {
    console.error("Error fetching daily attendance:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};



  const getTodayStatus = async (req, res) => {
    const userId = req.params.id;
    // console.log("Checking status for user:", userId);
  
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
        record
      });
    } catch (error) {
      console.error("Error fetching today's status:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };

 
  const generateDaysInMonth = (month) => {
    const start = new Date(`${month}-01`);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0); // Last day of month
  
    const slip = [];
  
    // Corrected loop to ensure the last day is included
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0]; // Format to yyyy-mm-dd
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" }); // e.g., Mon, Tue
  
      slip.push({
        date: dateStr,
        day: dayName,
      });
    }
  
    return slip;
  };
  
  
  const getSalaryUserSlip = async (req, res) => {
    const { userId, month } = req.query;
  
    if (!userId || !month) {
      return res.status(400).json({ message: "userId and month are required" });
    }
  
    const start = new Date(`${month}-01`);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0); // Last day of the month
  
    try {
      const user = await EmployeeModel.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      const dailySalary = 1000;
  
      const records = await Attendance.find({
        userId,
        date: { $gte: start, $lte: end },
      });
  
      const attendanceMap = new Map();
      records.forEach((rec) => {
        const key = new Date(rec.date).toISOString().split("T")[0]; // Format date to yyyy-mm-dd
        attendanceMap.set(key, rec);
      });
  
      const slip = [];
      let presentDays = 0;
      let totalWorkingDays = 0;
  
      const daysInMonth = generateDaysInMonth(month); // Generate all days in the month
  
      // Loop through each day in the month and check attendance
      for (const day of daysInMonth) {
        const isSunday = day.day === "Sun";
  
        if (isSunday) {
          slip.push({
            ...day,
            status: "-",
            payment: 0,
          });
          continue;
        }
  
        totalWorkingDays++;
        const attendance = attendanceMap.get(day.date);
        const isPresent = attendance?.clockIn;
  
        if (isPresent) presentDays++;
  
        slip.push({
          ...day,
          status: isPresent ? "Present" : "Absent",
          payment: isPresent ? dailySalary : 0,
        });
      }
  
      return res.json({
        user: {
          name: user.name,
          email: user.email,
        },
        month,
        dailySalary,
        presentDays,
        totalWorkingDays,
        totalSalary: presentDays * dailySalary,
        slip,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error generating salary slip" });
    }
  };
  
  const getSalaryAdminSlip = async (req, res) => {
    const { month } = req.query;
  // console.log("month",month);
  
    if (!month) {
      return res.status(400).json({ message: "Month is required" });
    }
  
    const start = new Date(`${month}-01`);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  
    try {
      const users = await EmployeeModel.find(); // Fetch all users
  
      const dailySalary = 1000;
      const daysInMonth = generateDaysInMonth(month);
  
      const allSlips = [];
  
      for (const user of users) {
        const records = await Attendance.find({
          userId: user._id,
          date: { $gte: start, $lte: end },
        });
  
        const attendanceMap = new Map();
        records.forEach((rec) => {
          const key = new Date(rec.date).toISOString().split("T")[0];
          attendanceMap.set(key, rec);
        });
  
        const slip = [];
        let presentDays = 0;
        let totalWorkingDays = 0;
  
        for (const day of daysInMonth) {
          const isSunday = day.day === "Sun";
  
          if (isSunday) {
            slip.push({ ...day, status: "-", payment: 0 });
            continue;
          }
  
          totalWorkingDays++;
          const attendance = attendanceMap.get(day.date);
          const isPresent = attendance?.clockIn;
  
          if (isPresent) presentDays++;
  
          slip.push({
            ...day,
            status: isPresent ? "Present" : "Absent",
            payment: isPresent ? dailySalary : 0,
          });
        }
  
        allSlips.push({
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
          },
          month,
          dailySalary,
          presentDays,
          totalWorkingDays,
          totalSalary: presentDays * dailySalary,
          slip,
        });
      }
  
      return res.json(allSlips);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error generating salary slips" });
    }
  };
  
  
  
  
  
// const getSalarySlip = async (req, res) => {
//   const { userId, month } = req.query;
// // console.log("req.query",req.query);

//   if (!userId || !month) {
//     return res.status(400).json({ message: 'userId and month are required' });
//   }

//   const start = new Date(`${month}-01`);
//   const end = new Date(start);
//   end.setMonth(end.getMonth() + 1);

//   try {
//     const records = await Attendance.find({
//       userId,
//       date: {
//         $gte: start,
//         $lt: end,
//       },
//     });

//     const presentDays = records.filter(r => {
//       const day = new Date(r.date).getDay();
//       return r.clockIn && r.clockOut && day !== 0; // 0 = Sunday
//     }).length;

//     const user = await EmployeeModel.findById(userId);
//     const salaryPerDay = user?.dailySalary || 1000; // default fallback

//     const totalSalary = salaryPerDay * presentDays;

//     res.json({
//       user: {
//         name: user?.name,
//         email: user?.email,
//       },
//       month,
//       presentDays,
//       salaryPerDay,
//       totalSalary,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Failed to generate salary slip' });
//   }
// };
  
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

module.exports = { clockIn, clockOut,addDailyComment ,getTodayStatus,getMonthlyAttendance,getDailyAttendance,getMonthlyAttendanceByUserId,getDailyAttendanceByUserId,getSalaryUserSlip,getSalaryAdminSlip,assignTask, startTask, pauseTask, completeTask  };