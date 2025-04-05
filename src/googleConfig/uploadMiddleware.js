const multer = require("multer");

// Configure Multer storage
const uploadVideo = multer({ dest: "uploads/" });

module.exports = uploadVideo;
