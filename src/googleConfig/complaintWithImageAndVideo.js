 const multer = require("multer");
const multers3 = require("multer-s3");
const aws = require("aws-sdk");

// ✅ S3 configuration
const s3 = new aws.S3({
  region: process.env.AWS_BUCKET_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_V,
  secretAccessKey: process.env.AWS_SECRET_KEY_V,
});

// ✅ Image upload to S3
const imageUpload = multer({
  storage: multers3({
    s3,
    bucket: "sparetrade-bucket",
    metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
    key: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
  }),
});

// ✅ Video upload to memory (for Google Drive)
const videoUpload = multer({ storage: multer.memoryStorage() });

// ✅ Combined middleware
// const handleUploads = (req, res, next) => {
//   const upload = multer().fields([
//     { name: "issueImages", maxCount: 1 }, // must match frontend
//     { name: "issueVideo", maxCount: 1 },  // must match frontend
//   ]);

//   upload(req, res, (err) => {
//     if (err) return next(err);
//     next();
//   });
// };


const storage = multer.memoryStorage();
// const upload = multer({ storage }).fields([
//   { name: "issueImages", maxCount: 1 },
//   { name: "issueVideo", maxCount: 1 },
// ]);

// // ✅ Middleware
// const handleUploads = async (req, res, next) => {
//   upload(req, res, async (err) => {
//     if (err) return next(err);

//     try {
//       // 1️⃣ Upload image to S3 if present
//       if (req.files?.issueImages?.[0]) {
//         const file = req.files.issueImages[0];
//         const params = {
//           Bucket: process.env.AWS_BUCKET_NAME,
//           Key: Date.now() + "-" + file.originalname,
//           Body: file.buffer,
//           ContentType: file.mimetype,
//         };

//         const uploadResult = await s3.upload(params).promise();
//         req.files.issueImages[0].s3Location = uploadResult.Location;
//       }

//       // 2️⃣ Video is already in memory; you can handle it in controller for Google Drive
//       next();
//     } catch (error) {
//       next(error);
//     }
//   });
// };


const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg"];
const allowedVideoTypes = ["video/mp4", "video/webm", "video/ogg"];

// Multer instance with validation
const upload = multer({
  storage,
  limits: {
    fileSize: 51 * 1024 * 1024, // 10MB max (apply per file)
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "issueImages") {
      if (!allowedImageTypes.includes(file.mimetype)) {
        return cb(new Error("Only JPG, JPEG, PNG images are allowed"), false);
      }
    }
    if (file.fieldname === "issueVideo") {
      if (!allowedVideoTypes.includes(file.mimetype)) {
        return cb(new Error("Only MP4, WebM, OGG videos are allowed"), false);
      }
    }
    cb(null, true);
  },
}).fields([
  { name: "issueImages", maxCount: 1 },
  { name: "issueVideo", maxCount: 1 },
]);

const handleUploads = async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      // Multer error handling (size/type/etc)
      return res.status(400).json({ error: err.message });
    }

    try {
      // 1️⃣ Upload image to S3 if present
      if (req.files?.issueImages?.[0]) {
        const file = req.files.issueImages[0];
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: Date.now() + "-" + file.originalname,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        const uploadResult = await s3.upload(params).promise();
        req.files.issueImages[0].s3Location = uploadResult.Location;
      }

      // 2️⃣ Video remains in memory (req.files.issueVideo[0].buffer)
      // Handle video in your controller (e.g., upload to Google Drive)
      next();
    } catch (error) {
      next(error);
    }
  });
};


module.exports = { imageUpload, videoUpload, handleUploads };
