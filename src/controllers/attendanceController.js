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

 
  // const generateDaysInMonth = (month) => {
  //   const start = new Date(`${month}-01`);
  //   const end = new Date(start.getFullYear(), start.getMonth() + 1, 0); // Last day of month
  
  //   const slip = [];
  
  //   // Corrected loop to ensure the last day is included
  //   for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
  //     const dateStr = d.toISOString().split("T")[0]; // Format to yyyy-mm-dd
  //     const dayName = d.toLocaleDateString("en-US", { weekday: "short" }); // e.g., Mon, Tue
  
  //     slip.push({
  //       date: dateStr,
  //       day: dayName,
  //     });
  //   }
  
  //   return slip;
  // };
  
  function generateDaysInMonth(month) {
    const [year, monthIndex] = month.split("-").map(Number); // e.g., "2025-04" -> [2025, 4]

    // Get the total number of days in the month
    const totalDays = new Date(year, monthIndex, 0).getDate(); // Last day of the given month
  
    const days = [];
  
    // Loop through all days of the month
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, monthIndex - 1, i); // Adjust for 0-based month (0 = January)
      
      // Format as DD-MM-YY (01-04-25 format)
    const formattedDate = `${year}-${monthIndex < 10 ? '0' + monthIndex : monthIndex}-${i < 10 ? '0' + i : i}`;
      
      // Get the day of the week (Mon, Tue, Wed, etc.)
      const dayOfWeek = date.toLocaleString('en-us', { weekday: 'short' });
  
      days.push({ date: formattedDate, day: dayOfWeek });
    }
  
    return days;
  };
 
// console.log(generateDaysInMonth("2025-04"));



  
  
  
  

  // const getSalaryUserSlip = async (req, res) => {
  //   const { userId, month } = req.query;
  
  //   if (!userId || !month) {
  //     return res.status(400).json({ message: "userId and month are required" });
  //   }
  
  //   const start = new Date(`${month}-01`);
  //   const end = new Date(start.getFullYear(), start.getMonth() + 1, 0); // Last day of the month
  
  //   try {
  //     const user = await EmployeeModel.findById(userId);
  //     if (!user) return res.status(404).json({ message: "User not found" });
  
  //     const dailySalary = 1000;
  
  //     const records = await Attendance.find({
  //       userId,
  //       date: { $gte: start, $lte: end },
  //     });
  
  //     const attendanceMap = new Map();
  //     records.forEach((rec) => {
  //       const key = new Date(rec.date).toISOString().split("T")[0]; // Format date to yyyy-mm-dd
  //       attendanceMap.set(key, rec);
  //     });
  
  //     const slip = [];
  //     let presentDays = 0;
  //     let totalWorkingDays = 0;
  
  //     const daysInMonth = generateDaysInMonth(month); // Generate all days in the month
  
  //     // Loop through each day in the month and check attendance
  //     for (const day of daysInMonth) {
  //       const isSunday = day.day === "Sun";
  
  //       if (isSunday) {
  //         slip.push({
  //           ...day,
  //           status: "-",
  //           payment: 0,
  //         });
  //         continue;
  //       }
  
  //       totalWorkingDays++;
  //       const attendance = attendanceMap.get(day.date);
  //       const isPresent = attendance?.clockIn;
  
  //       if (isPresent) presentDays++;
  
  //       slip.push({
  //         ...day,
  //         status: isPresent ? "Present" : "Absent",
  //         payment: isPresent ? dailySalary : 0,
  //       });
  //     }
  
  //     return res.json({
  //       user: {
  //         name: user.name,
  //         email: user.email,
  //       },
  //       month,
  //       dailySalary,
  //       presentDays,
  //       totalWorkingDays,
  //       totalSalary: presentDays * dailySalary,
  //       slip,
  //     });
  //   } catch (err) {
  //     console.error(err);
  //     res.status(500).json({ message: "Error generating salary slip" });
  //   }
  // };
  
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

    // Total days in the month (using daysInMonth function)
    const daysInMonth = generateDaysInMonth(month);
    const totalDaysInMonth = daysInMonth.length;

    // Calculate daily salary based on user's salary and the number of days in the month
    const dailySalary = user.salary / totalDaysInMonth;

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
    let sundayDays = 0; // To keep track of Sundays worked/paid
    let totalWorkingDays = 0;

    // Loop through each day in the month and check attendance
    for (const day of daysInMonth) {
      const isSunday = day.day === "Sun";

      if (isSunday) {
        sundayDays++; // Increment Sundays count
        slip.push({
          ...day,
          status: "-", // Sunday should show "-"
          payment: dailySalary, // Pay the daily salary for Sundays
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

    // Calculate the total salary considering present days and Sundays
    const totalSalary = presentDays * dailySalary + sundayDays * dailySalary;

    return res.json({
      user: {
        name: user.name,
        email: user.email,
      },
      month,
      dailySalary: parseFloat(dailySalary.toFixed(2)), // Rounded daily salary
      presentDays,
      sundayDays, // Include Sundays worked/paid in the response
      totalWorkingDays,
      totalSalary: parseFloat(totalSalary.toFixed(2)), // Total salary
      slip,
      sundayCount: sundayDays, // Add the Sunday count for reference
      dayCharges: parseFloat(dailySalary.toFixed(2)), // Add the daily salary charges
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating salary slip" });
  }
};

  
  
   



// const getSalaryAdminSlip = async (req, res) => {
//   const { month } = req.query;

//   if (!month) {
//     return res.status(400).json({ message: "Month is required" });
//   }

//   const start = new Date(`${month}-01`);
//   const end = new Date(start.getFullYear(), start.getMonth() + 1, 0); // Last day of the month

//   try {
//     const users = await EmployeeModel.find(); // Fetch all users
//     const daysInMonth = generateDaysInMonth(month); // Generate all days in the month

//     const allSlips = [];

//     for (const user of users) {
//       const records = await Attendance.find({
//         userId: user._id,
//         date: { $gte: start, $lte: end },
//       });

//       const attendanceMap = new Map();
//       records.forEach((rec) => {
//         const key = new Date(rec.date).toISOString().split("T")[0]; // Format date to yyyy-mm-dd
//         attendanceMap.set(key, rec); // Store attendance record in the map
//       });

//       const slip = [];
//       const totalDaysInMonth = daysInMonth.length; // Total days in the month (30 for April)
//       const dailySalary = user.salary / totalDaysInMonth; // Daily salary based on all 30 days

//       let presentDays = 0;
//       let sundayDays = 0; // To keep track of Sundays worked

//       // Loop through each day in the month to determine attendance
//       for (const day of daysInMonth) {
//         const isSunday = day.day === "Sun";

//         // Check if attendance exists for the current day
//         const attendance = attendanceMap.get(day.date); // Fetch attendance record for the day
//         const isPresent = attendance?.clockIn; // Check if the user was present on this day

//         // If present, increment presentDays
//         if (isPresent) presentDays++;

//         // If it's Sunday, the user should be paid, even if absent
//         if (isSunday) {
//           sundayDays++; // Count Sundays
//           slip.push({
//             ...day,
//             status: "Absent", // Mark Sunday as absent (if no attendance)
//             payment: dailySalary, // Pay the daily salary for Sundays
//           });
//         } else {
//           // If it's not Sunday, calculate salary based on attendance
//           slip.push({
//             ...day,
//             status: isPresent ? "Present" : "Absent", // Status based on presence
//             payment: isPresent ? dailySalary : 0, // Pay the daily salary only if present
//           });
//         }
//       }

//       // Calculate the total salary based on the user's daily salary and the number of days in the month
//       const totalSalary = presentDays * dailySalary + sundayDays * dailySalary;

//       allSlips.push({
//         user: {
//           _id: user._id,
//           name: user.name,
//           email: user.email,
//         },
//         month,
//         totalMonthlySalary: user.salary,
//         dailySalary: parseFloat(dailySalary.toFixed(2)), // Rounded daily salary
//         presentDays,
//         sundayDays,
//         totalSalary: parseFloat(totalSalary.toFixed(2)), // Total salary for present days + Sundays
//         slip,
//       });
//     }

//     return res.json(allSlips); // Return all salary slips
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Error generating salary slips" });
//   }
// };


const getSalaryAdminSlip = async (req, res) => {
  const { month } = req.query;

  if (!month) {
    return res.status(400).json({ message: "Month is required" });
  }

  const start = new Date(`${month}-01`);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0); // Last day of the month

  try {
    const users = await EmployeeModel.find(); // Fetch all users
    const daysInMonth = generateDaysInMonth(month); // Generate all days in the month

    const allSlips = [];

    for (const user of users) {
      const records = await Attendance.find({
        userId: user._id,
        date: { $gte: start, $lte: end },
      });

      const attendanceMap = new Map();
      records.forEach((rec) => {
        const key = new Date(rec.date).toISOString().split("T")[0]; // Format date to yyyy-mm-dd
        attendanceMap.set(key, rec); // Store attendance record in the map
      });

      const slip = [];
      const totalDaysInMonth = daysInMonth.length; // Total days in the month (30 for April)
      const dailySalary = user.salary / totalDaysInMonth; // Daily salary based on all 30 days

      let presentDays = 0;
      let sundayDays = 0; // To keep track of Sundays worked

      // Loop through each day in the month to determine attendance
      for (const day of daysInMonth) {
        const isSunday = day.day === "Sun";

        // Check if attendance exists for the current day
        const attendance = attendanceMap.get(day.date); // Fetch attendance record for the day
        const isPresent = attendance?.clockIn; // Check if the user was present on this day

        // If present, increment presentDays
        if (isPresent) presentDays++;

        // If it's Sunday, the user should be paid, even if absent
        if (isSunday) {
          sundayDays++; // Count Sundays
          slip.push({
            ...day,
            status: isPresent ? "Present" : "Absent", // Mark Sunday as Present or Absent
            payment: dailySalary, // Pay the daily salary for Sundays, whether present or absent
          });
        } else {
          // If it's not Sunday, calculate salary based on attendance
          slip.push({
            ...day,
            status: isPresent ? "Present" : "Absent", // Status based on presence
            payment: isPresent ? dailySalary : 0, // Pay the daily salary only if present
          });
        }
      }

      // Calculate the total salary based on the user's daily salary and the number of days in the month
      const totalSalary = (presentDays + sundayDays) * dailySalary;

      allSlips.push({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
        },
        month,
        totalMonthlySalary: user.salary,
        dailySalary: parseFloat(dailySalary.toFixed(2)), // Rounded daily salary
        presentDays,
        sundayDays,
        totalSalary: parseFloat(totalSalary.toFixed(2)), // Total salary for present days + Sundays
        slip,
      });
    }

    return res.json(allSlips); // Return all salary slips
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating salary slips" });
  }
};



 








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