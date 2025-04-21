const express = require('express');
const router = express.Router();
const { clockIn, clockOut ,getTodayStatus,getDailyAttendance,assignTask, startTask, pauseTask, completeTask } = require('../controllers/attendanceController');


// Route for clocking in
router.post('/attendance/clock-in', clockIn);

// Route for clocking out
router.post('/attendance/clock-out', clockOut);

router.get('/attendance/getTodayStatus/:id', getTodayStatus);
router.get('/attendance/getDailyAttendance', getDailyAttendance);

// Route for assigning tasks
router.post('/assign', assignTask);

// Route for starting a task
router.put('/start/:taskId', startTask);

// Route for pausing a task
router.put('/pause/:taskId', pauseTask);

// Route for completing a task
router.put('/complete/:taskId', completeTask);

module.exports = router;
