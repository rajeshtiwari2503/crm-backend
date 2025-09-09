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
// const imageUpload = multer({
//   storage: multers3({
//     s3,
//     bucket: "sparetrade-bucket",
//     metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
//     key: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
//   }),
// });

// ✅ Video upload to memory (for Google Drive)
// const videoUpload = multer({ storage: multer.memoryStorage() });

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

 // ✅ Image -> S3
 

 
const handleUploads = multer({
  storage: multer.memoryStorage(),
  limits: { files: 2, fileSize: 51 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "issueImages") {
      return /image\/(jpeg|jpg|png)/.test(file.mimetype)
        ? cb(null, true)
        : cb(new Error("Only JPG/PNG images allowed"));
    }
    if (file.fieldname === "issueVideo") {
      return /video\/(mp4|webm|ogg)/.test(file.mimetype)
        ? cb(null, true)
        : cb(new Error("Only MP4/WebM/OGG videos allowed"));
    }
    cb(new Error(`Unexpected field: ${file.fieldname}`));
  },
}).fields([
  { name: "issueImages", maxCount: 1 },
  { name: "issueVideo", maxCount: 1 },
]);

// router.post("/createComplaintWithVideo", upload, createComplaintWithVideo);


module.exports = {   handleUploads };
