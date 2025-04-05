const multer = require("multer");

// Configure Multer storage
// const uploadVideo = multer({ dest: "uploads/" });
const uploadVideo = multer({ storage: multer.memoryStorage() });

module.exports = uploadVideo;
