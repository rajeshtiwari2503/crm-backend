const express = require('express');
const router = express.Router();
const { clockIn, clockOut,addDailyComment,updateAttendance ,getTodayStatus,getMonthlyAttendance,getDailyAttendance,getMonthlyAttendanceByUserId,getDailyAttendanceByUserId,getSalaryUserSlip,getSalaryAdminSlip,assignTask, startTask, pauseTask, completeTask } = require('../controllers/attendanceController');


// Route for clocking in
router.post('/attendance/clock-in', clockIn);

// Route for clocking out
router.post('/attendance/clock-out', clockOut);

router.put('/attendance/addDailyComment',addDailyComment);

router.get('/attendance/getTodayStatus/:id', getTodayStatus);
router.get('/attendance/getDailyAttendance', getDailyAttendance);
router.get('/attendance/getDailyAttendanceByUserId', getDailyAttendanceByUserId);
router.get('/attendance/getMonthlyAttendanceByUserId', getMonthlyAttendanceByUserId);
router.get('/attendance/getMonthlyAttendance', getMonthlyAttendance);
router.get('/attendance/getSalaryUserSlip', getSalaryUserSlip);
router.get('/attendance/getSalaryAdminSlip', getSalaryAdminSlip);
router.put('/attendance/updateAttendance/:id', updateAttendance);

// Route for assigning tasks
router.post('/assign', assignTask);

// Route for starting a task
router.put('/start/:taskId', startTask);

// Route for pausing a task
router.put('/pause/:taskId', pauseTask);

// Route for completing a task
router.put('/complete/:taskId', completeTask);

module.exports = router;
