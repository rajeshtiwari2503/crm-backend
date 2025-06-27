const { Attendance, Task } = require('../models/attendanceModel');
const { EmployeeModel } = require('../models/registration');
const mongoose = require('mongoose');


// === Attendance Controller ===

const clockIn = async (req, res) => {
  try {
    const { userId, user, location } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const existing = await Attendance.findOne({ userId, date: today });
    if (existing) return res.status(400).json({ message: 'Already clocked in today' });

    const attendance = new Attendance({
      userId,
      user,
      date: today,
      location: location,
      clockIn: new Date()
    });

    await attendance.save();
    res.status(201).json({ status: true, msg: "Checkout Successfully", attendance });
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
    res.json({ status: true, msg: "Checkout Successfully", attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT: /api/attendance/comment/:userId
const addDailyComment = async (req, res) => {

  const { date, userId, taskComment } = req.body;
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

  res.json({ status: true, msg: 'Task comment added successfully', taskComment: attendance.taskComment });
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

//     // Total days in the month (using daysInMonth function)
//     const daysInMonth = generateDaysInMonth(month);
//     const totalDaysInMonth = daysInMonth.length;

//     // Calculate daily salary based on user's salary and the number of days in the month
//     const dailySalary = user.salary / totalDaysInMonth;

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
//     let sundayDays = 0; // To keep track of Sundays worked/paid
//     let totalWorkingDays = 0;

//     // Loop through each day in the month and check attendance
//     for (const day of daysInMonth) {
//       const isSunday = day.day === "Sun";

//       if (isSunday) {
//         sundayDays++; // Increment Sundays count
//         slip.push({
//           ...day,
//           status: "-", // Sunday should show "-"
//           payment: dailySalary, // Pay the daily salary for Sundays
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

//     // Calculate the total salary considering present days and Sundays
//     const totalSalary = presentDays * dailySalary + sundayDays * dailySalary;

//     return res.json({
//       user: {
//         name: user.name,
//         email: user.email,
//       },
//       month,
//       dailySalary: parseFloat(dailySalary.toFixed(2)), // Rounded daily salary
//       presentDays,
//       sundayDays, // Include Sundays worked/paid in the response
//       totalWorkingDays,
//       totalSalary: parseFloat(totalSalary.toFixed(2)), // Total salary
//       slip,
//       sundayCount: sundayDays, // Add the Sunday count for reference
//       dayCharges: parseFloat(dailySalary.toFixed(2)), // Add the daily salary charges
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
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0); // Last day of month

  try {
    const user = await EmployeeModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const daysInMonth = generateDaysInMonth(month);
    const totalDaysInMonth = daysInMonth.length;
    const dailySalary = user.salary ? user.salary / totalDaysInMonth : 0; // Safe division

    const records = await Attendance.find({
      userId,
      date: { $gte: start, $lte: end },
    });

    const attendanceMap = new Map();
    records.forEach((rec) => {
      const key = new Date(rec.date).toISOString().split("T")[0];
      attendanceMap.set(key, rec);
    });

    const slip = [];
    let presentDays = 0;
    let sundayDays = 0;
    let totalSalary = 0;

    for (let i = 0; i < daysInMonth.length; i++) {
      const day = daysInMonth[i];
      const isSunday = day.day === "Sun";

      const attendance = attendanceMap.get(day.date);
      const isPresent = attendance?.clockIn;

      let payment = 0;
      let status = "Absent";

      if (isSunday) {
        const prevDay = daysInMonth[i - 1]; // Saturday
        const prevAttendance = prevDay ? attendanceMap.get(prevDay.date) : null;
        const wasSaturdayPresent = prevAttendance?.clockIn;

        if (wasSaturdayPresent) {
          sundayDays++;
          payment = dailySalary;
          status = "Sunday Counted";
        } else {
          payment = 0; // No payment if no Saturday
          status = "Sunday (No Salary)";
        }
      } else {
        if (isPresent) {
          presentDays++;
          payment = dailySalary;
          status = "Present";
        }
      }

      totalSalary += payment;

      slip.push({
        ...day,
        status,
        payment: parseFloat(payment.toFixed(2)),
      });
    }

    return res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      month,
      dailySalary: parseFloat(dailySalary.toFixed(2)),
      presentDays,
      sundayDays,
      totalSalary: parseFloat(totalSalary.toFixed(2)),
      slip,
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
//   const end = new Date(start.getFullYear(), start.getMonth() + 1, 0); // Last day of month

//   try {
//     const users = await EmployeeModel.find(); // Fetch all employees
//     const daysInMonth = generateDaysInMonth(month); // Get all days in month

//     const allSlips = [];

//     for (const user of users) {
//       const records = await Attendance.find({
//         userId: user._id,
//         date: { $gte: start, $lte: end },
//       });

//       const attendanceMap = new Map();
//       records.forEach((rec) => {
//         const key = new Date(rec.date).toISOString().split("T")[0];
//         attendanceMap.set(key, rec);
//       });

//       const slip = [];
//       const totalDaysInMonth = daysInMonth.length;
//       const dailySalary = user.salary ? user.salary / totalDaysInMonth : 0; // Avoid division by 0

//       let presentDays = 0;
//       let sundayDays = 0;
//       let totalSalary = 0;

//       for (let i = 0; i < daysInMonth.length; i++) {
//         const day = daysInMonth[i];
//         const isSunday = day.day === "Sun";

//         const attendance = attendanceMap.get(day.date);
//         const isPresent = attendance?.clockIn;

//         let payment = 0;
//         let status = "Absent";

//         if (isSunday) {
//           const prevDay = daysInMonth[i - 1]; // Saturday
//           const prevAttendance = prevDay ? attendanceMap.get(prevDay.date) : null;
//           const wasSaturdayPresent = prevAttendance?.clockIn;

//           if (wasSaturdayPresent) {
//             sundayDays++;
//             payment = dailySalary;
//             status = "Sunday Counted";
//           } else {
//             payment = 0; // No Sunday salary if Saturday absent
//             status = "Sunday (No Salary)";
//           }
//         } else {
//           if (isPresent) {
//             presentDays++;
//             payment = dailySalary;
//             status = "Present";
//           }
//         }

//         totalSalary += payment;

//         slip.push({
//           ...day,
//           status,
//           payment: parseFloat(payment.toFixed(2)),
//         });
//       }

//       allSlips.push({
//         user: {
//           _id: user._id,
//           name: user.name,
//           email: user.email,
//         },
//         month,
//         totalMonthlySalary: user.salary,
//         dailySalary: parseFloat(dailySalary.toFixed(2)),
//         presentDays,
//         sundayDays,
//         totalSalary: parseFloat(totalSalary.toFixed(2)),
//         slip,
//       });
//     }

//     return res.json(allSlips);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Error generating salary slips" });
//   }
// };





// const getSalaryAdminSlip = async (req, res) => {
//   const { month } = req.query;

//   if (!month) {
//     return res.status(400).json({ message: "Month is required" });
//   }

//   const start = new Date(`${month}-01`);
//   const end = new Date(start.getFullYear(), start.getMonth() + 1, 0); // Last day of month

//   try {
//     const users = await EmployeeModel.find(); // Fetch all employees
//     const daysInMonth = generateDaysInMonth(month); // Get all days in month

//     const allSlips = [];

//     for (const user of users) {
//       const records = await Attendance.find({
//         userId: user._id,
//         date: { $gte: start, $lte: end },
//       });

//       const attendanceMap = new Map();
//       records.forEach((rec) => {
//         const key = new Date(rec.date).toISOString().split("T")[0];
//         attendanceMap.set(key, rec);
//       });

//       const slip = [];
//       const totalDaysInMonth = daysInMonth.length;
//       const dailySalary = user.salary ? user.salary / totalDaysInMonth : 0; // Avoid division by 0

//       let presentDays = 0;
//       let sundayDays = 0;
//       let totalSalary = 0;

//       for (let i = 0; i < daysInMonth.length; i++) {
//         const day = daysInMonth[i];
//         const isSunday = day.day === "Sun";

//         const attendance = attendanceMap.get(day.date);
//         const isPresent = attendance?.clockIn && attendance?.clockOut;

//         let payment = 0;
//         let status = "Absent";

//         if (isSunday) {
//           const prevDay = daysInMonth[i - 1]; // Saturday
//           const prevAttendance = prevDay ? attendanceMap.get(prevDay.date) : null;
//           const wasSaturdayPresent = prevAttendance?.clockIn && prevAttendance?.clockOut;

//           if (wasSaturdayPresent) {
//             sundayDays++;
//             payment = dailySalary;
//             status = "Sunday Counted";
//           } else {
//             payment = 0; // No Sunday salary if Saturday absent
//             status = "Sunday (No Salary)";
//           }
//         } else {
//           if (isPresent) {
//             presentDays++;

//             const clockIn = new Date(attendance.clockIn);
//             const clockOut = new Date(attendance.clockOut);

//             const workingMilliseconds = clockOut - clockIn;
//             const workingHours = workingMilliseconds / (1000 * 60 * 60); // convert ms to hours

//             if (workingHours >= 8) {
//               payment = dailySalary;
//               status = "Present (Full Day)";
//             } else {
//               const fraction = workingHours / 8;
//               payment = dailySalary * fraction;
//               status = `Present (Partial - ${workingHours.toFixed(2)} hrs)`;
//             }
//           }
//         }

//         totalSalary += payment;

//         slip.push({
//           ...day,
//           status,
//           payment: parseFloat(payment.toFixed(2)),
//         });
//       }

//       allSlips.push({
//         user: {
//           _id: user._id,
//           name: user.name,
//           email: user.email,
//         },
//         month,
//         totalMonthlySalary: user.salary,
//         dailySalary: parseFloat(dailySalary.toFixed(2)),
//         presentDays,
//         sundayDays,
//         totalSalary: parseFloat(totalSalary.toFixed(2)),
//         slip,
//       });
//     }

//     return res.json(allSlips);
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
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0); // Last day of month

  try {
    const users = await EmployeeModel.find(); // Fetch all employees
    const daysInMonth = generateDaysInMonth(month); // Get all days in month

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
      const totalDaysInMonth = daysInMonth.length;
      const dailySalary = user.salary ? user.salary / totalDaysInMonth : 0; // Avoid division by 0

      let presentDays = 0;
      let sundayDays = 0;
      let totalSalary = 0;

      for (let i = 0; i < daysInMonth.length; i++) {
        const day = daysInMonth[i];
        const isSunday = day.day === "Sun";

        const attendance = attendanceMap.get(day.date);
        const isPresent = attendance?.clockIn && attendance?.clockOut;

        let payment = 0;
        let status = "Absent";

        if (isSunday) {
          if (i === 0) {
            // First day of month is Sunday → count salary without checking Saturday
            sundayDays++;
            payment = dailySalary;
            status = "Sunday Counted (First day of month)";
          } else {
            const prevDay = daysInMonth[i - 1]; // Saturday
            const prevAttendance = prevDay ? attendanceMap.get(prevDay.date) : null;
            const wasSaturdayPresent = prevAttendance?.clockIn && prevAttendance?.clockOut;

            if (wasSaturdayPresent) {
              sundayDays++;
              payment = dailySalary;
              status = "Sunday Counted";
            } else {
              payment = 0; // No Sunday salary if Saturday absent
              status = "Sunday (No Salary)";
            }
          }
        } else {
          if (isPresent) {
            presentDays++;

            let clockIn = new Date(attendance.clockIn);
            let clockOut = new Date(attendance.clockOut);

            // Office end time = 6:00 PM
            const officeEndTime = new Date(clockIn);
            officeEndTime.setHours(18, 0, 0, 0); // 18:00 = 6:00 PM

            if (clockOut > officeEndTime) {
              clockOut = officeEndTime;
            }

            const workingMilliseconds = clockOut - clockIn;
            const workingHours = workingMilliseconds / (1000 * 60 * 60); // convert ms to hours

            if (workingHours >= 8) {
              payment = dailySalary;
              status = "Present (Full Day)";
            } else if (workingHours > 0) {
              const fraction = workingHours / 8;
              payment = dailySalary * fraction;
              status = `Present (Partial - ${workingHours.toFixed(2)} hrs)`;
            } else {
              payment = 0;
              status = "Absent (Less than minimum hours)";
            }
          }
        }

        totalSalary += payment;

        slip.push({
          ...day,
          status,
          payment: parseFloat(payment.toFixed(2)),
        });
      }

      allSlips.push({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
        },
        month,
        totalMonthlySalary: user.salary,
        dailySalary: parseFloat(dailySalary.toFixed(2)),
        presentDays,
        sundayDays,
        totalSalary: parseFloat(totalSalary.toFixed(2)),
        slip,
      });
    }

    return res.json(allSlips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating salary slips" });
  }
};



// const updateAttendance= async (req, res) => {
//   try {
//     const { clockIn, clockOut } = req.body;

//     const updatedRecord = await Attendance.findByIdAndUpdate(
//       req.params.id,
//       { clockIn, clockOut },
//       { new: true }
//     );

//     if (!updatedRecord) {
//       return res.status(404).json({ message: 'Attendance record not found.' });
//     }

//     res.json({
//       message: 'Attendance updated successfully.',
//       data: updatedRecord
//     });
//   } catch (error) {
//     console.error('Error updating attendance:', error);
//     res.status(500).json({ message: 'Server Error', error: error.message });
//   }
// };

// PUT /api/attendance/update/:id
const updateAttendance = async (req, res) => {
  try {
    const { clockIn, clockOut } = req.body;
    const attendanceId = req.params.id;

    if (!clockIn || !clockOut) {
      return res.status(400).json({ message: 'Clock In and Clock Out are required.' });
    }

    const attendance = await Attendance.findById(attendanceId);

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found.' });
    }

    attendance.clockIn = new Date(clockIn);
    attendance.clockOut = new Date(clockOut);

    // 👇 Calculate totalHours and totalHoursDecimal
    const diffMs = attendance.clockOut - attendance.clockIn; // Difference in milliseconds
    const totalMinutes = Math.floor(diffMs / (1000 * 60));   // Convert ms to minutes
    const hours = Math.floor(totalMinutes / 60);             // Get full hours
    const minutes = totalMinutes % 60;                       // Remaining minutes

    attendance.totalHours = `${hours} hrs ${minutes} mins`;
    attendance.totalHoursDecimal = parseFloat((totalMinutes / 60).toFixed(2));

    await attendance.save();

    res.status(200).json({ message: 'Attendance updated successfully.', data: attendance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
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

module.exports = { clockIn, clockOut, updateAttendance, addDailyComment, getTodayStatus, getMonthlyAttendance, getDailyAttendance, getMonthlyAttendanceByUserId, getDailyAttendanceByUserId, getSalaryUserSlip, getSalaryAdminSlip, assignTask, startTask, pauseTask, completeTask };