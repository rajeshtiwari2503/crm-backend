const express = require("express")
const ComplaintModal = require("../models/complaint")

const {addComplaint,addDealerComplaint,getAllBrandComplaint,getAllComplaintByRole,getComplaintsByAssign,getComplaintsByCancel,getComplaintsByComplete
    ,getComplaintsByInProgress,getComplaintsByUpcomming,getComplaintsByCustomerSidePending,getComplaintsByPartPending,getComplaintsByPending,getComplaintsByFinalVerification, 
    getPendingComplaints,getTodayCompletedComplaints,getPartPendingComplaints,addAPPComplaint,getAllComplaint,getComplaintById,getComplaintByTechId,getComplaintBydealerId,getComplaintByCenterId,getComplaintByUserId,updateComplaintComments,editIssueImage ,updateFinalVerification,updatePartPendingImage,editComplaint,deleteComplaint,updateComplaint}=require("../controllers/complaintController")
const {upload}  = require("../services/service");
 
const uploadVideo = require("../googleConfig/uploadMiddleware");
const { updateComplaintWithVideo } = require("../googleConfig/complaintVideoController");

const { admin } = require('../firebase/index')

const moment = require("moment");
const router=express.Router()

router.post("/createComplaint",upload().single("issueImages")  , addComplaint);
// router.post("/createAppComplaint",upload().single("issueImages")  , addAPPComplaint);

router.post("/createAppComplaint" , addAPPComplaint);
router.post("/createDealerComplaint",upload().single("warrantyImage")  , addDealerComplaint);
 
// router.post("/createComplaint",  addComplaint);
router.get("/getAllComplaint",getAllComplaint)
router.get("/getAllBrandComplaint",getAllBrandComplaint)
router.get("/getAllComplaintByRole",getAllComplaintByRole)

router.get("/getComplaintsByAssign",getComplaintsByAssign)
router.get("/getComplaintsByCancel",getComplaintsByCancel)
router.get("/getComplaintsByComplete",getComplaintsByComplete)
router.get("/getComplaintsByInProgress",getComplaintsByInProgress)
router.get("/getComplaintsByUpcomming",getComplaintsByUpcomming)
router.get("/getComplaintsByPartPending",getComplaintsByPartPending)
router.get("/getComplaintsByCustomerSidePending",getComplaintsByCustomerSidePending)
router.get("/getComplaintsByPending",getComplaintsByPending)
router.get("/getComplaintsByFinalVerification",getComplaintsByFinalVerification)
router.get("/getTodayCompletedComplaints",getTodayCompletedComplaints)
 
router.get("/getComplaintById/:id",getComplaintById)
router.get("/getPendingComplaints/:days",getPendingComplaints)
router.get("/getPartPendingComplaints/:days",getPartPendingComplaints)
router.get("/getComplaintByUserId/:id",getComplaintByUserId)
router.get("/getComplaintByCenterId/:id",getComplaintByCenterId)
router.get("/getComplaintBydealerId/:id",getComplaintBydealerId)
router.get("/getComplaintByTechId/:id",getComplaintByTechId)
router.patch("/editImage/:id", upload().single("issueImages"),editIssueImage );
router.patch("/updateFinalVerification/:id", upload().single("partImage"),updateFinalVerification );
router.patch("/updateComplaintWithImage/:id", upload().single("partPendingImage"),updatePartPendingImage );

router.patch("/updateComplaintWithVideo/:id", uploadVideo.single("partPendingVideo"), updateComplaintWithVideo);

router.patch("/editComplaint/:id",editComplaint)
router.patch("/updateComplaintComments/:id",updateComplaintComments)
router.delete("/deleteComplaint/:id",deleteComplaint)
router.patch("/updateComplaint/:id",updateComplaint )

const mongoose = require("mongoose");





 

router.get("/searchComplaint", async (req, res) => {
  try {
    const { searchTerm } = req.query;
    if (!searchTerm || searchTerm.trim() === "") {
      return res.status(400).json({ message: "Search term is required" });
    }

    let searchConditions = [];
    const trimmedSearchTerm = searchTerm.trim();

    // ✅ Check if searchTerm is a valid ObjectId (24 hex characters)
    if (/^[a-fA-F0-9]{24}$/.test(trimmedSearchTerm)) {
      searchConditions.push({ _id: new mongoose.Types.ObjectId(trimmedSearchTerm) });
    }
// console.log("trimmedSearchTerm",trimmedSearchTerm);

  //  ✅ Search by phone number (Regex for case-insensitive match)
    searchConditions.push({ phoneNumber:trimmedSearchTerm });
    searchConditions.push({ district: { $regex: trimmedSearchTerm, $options: "i" } });
    searchConditions.push({ state: { $regex: trimmedSearchTerm, $options: "i" } });
    
    searchConditions.push({ complaintId:trimmedSearchTerm });
    
    searchConditions.push({ status: trimmedSearchTerm?.toUpperCase() });


   // 🔍 Debugging
    console.log("Search Conditions:", searchConditions);

    // 🔍 Execute query
    const filteredComplaints = await ComplaintModal.find({ $or: searchConditions });

    // console.log("Filtered Complaints:", filteredComplaints);
    res.status(200).json(filteredComplaints);
  } catch (error) {
    console.error("Error searching complaints:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/check-part-pending", async (req, res) => {
  try {
    const todayStart = moment().startOf("day").toDate();
    const todayEnd = moment().endOf("day").toDate();

    // Find all complaints with status "Part Pending"
    const updatedToday = await ComplaintModal.find({
      status: "PART PENDING",
      updatedAt: { $gte: todayStart, $lte: todayEnd }, // Updated today
    }).lean(); // Convert to plain objects

    const notUpdatedToday = await ComplaintModal.find({
      status: "PART PENDING",
      updatedAt: { $lt: todayStart }, // Not updated today
    }).lean(); // Convert to plain objects

    res.status(200).json({
      status: true,
      msg: "Part Pending complaints retrieved successfully",
      updatedToday,
      notUpdatedToday,
    });
  } catch (error) {
    console.error("Error fetching Part Pending complaints:", error);
    res.status(500).json({ status: false, msg: "Server error." });
  }
});



// const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();


// router.post("/send-otp", async (req, res) => {
//   const { complaintId } = req.body;

//   console.log("Received complaintId:", complaintId);

//   if (!complaintId || !mongoose.Types.ObjectId.isValid(complaintId)) {
//     return res.status(400).json({ success: false, message: "Invalid complaint ID!" });
//   }

//   try {
//     // 🔹 Find Complaint by ID
//     const complaint = await ComplaintModal.findOne({ _id: complaintId });

//     if (!complaint) {
//       return res.status(404).json({ success: false, message: "Complaint not found!" });
//     }

//     // 🔹 Generate OTP & Expiry Time (5 minutes)
//     const otp = generateOTP();
//     const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

//     // 🔹 Save OTP to MongoDB
//     complaint.otp = otp;
//     complaint.otpExpiresAt = otpExpiresAt;
//     await complaint.save();

//     const phoneNumber = `+${complaint.phoneNumber}`;

//     try {
//       // 🔹 Check if User Exists in Firebase
//       const response = await admin.auth().getUserByPhoneNumber(phoneNumber);
//       console.log("Firebase OTP Response response:", response);
//     } catch (err) {
//       // 🔹 If Not Exist, Create User in Firebase
//       const response1 = await admin.auth().createUser({ phoneNumber });
//       console.log("Firebase OTP Response response1:", response1);
//     }

//     console.log(`📩 OTP sent to ${complaint.phoneNumber}: ${otp}`);
//     res.status(200).json({ success: true, message: "OTP sent successfully!" });

//   } catch (error) {
//     console.error("❌ Error sending OTP:", error);
//     res.status(500).json({ success: false, message: "Error sending OTP", error: error.message || error });
//   }
// });
 
router.post("/send-otp", async (req, res) => {
  const { complaintId } = req.body;

  console.log("Received complaintId:", complaintId);

  if (!complaintId || !mongoose.Types.ObjectId.isValid(complaintId)) {
    return res.status(400).json({ success: false, message: "Invalid complaint ID!" });
  }

  try {
    // 🔹 Find Complaint by ID
    const complaint = await ComplaintModal.findOne({ _id: complaintId });

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found!" });
    }

    // 🔹 Format phone number with country code
    let phoneNumber = complaint.phoneNumber.trim();
    if (!phoneNumber.startsWith("+")) {
      phoneNumber = `+91${phoneNumber}`;
    }

    // 🔹 Generate OTP & Expiry Time (5 minutes)
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 🔹 Save OTP to MongoDB
    complaint.otp = otp;
    // complaint.otpExpiresAt = otpExpiresAt;
    // complaint.phoneNumber = phoneNumber; // Ensure the formatted number is saved
    await complaint.save();

    // try {
    //   // 🔹 Check if User Exists in Firebase
    //   const response = await admin.auth().getUserByPhoneNumber(phoneNumber);
    //   console.log("Firebase OTP Response:", response);
    // } catch (err) {
    //   // 🔹 If Not Exist, Create User in Firebase
    //   const response1 = await admin.auth().createUser({ phoneNumber });
    //   console.log("Firebase OTP Response (New User):", response1);
    // }

    // console.log(`📩 OTP sent to ${phoneNumber}: ${otp}`);
    res.status(200).json({ success: true, message: `OTP sent to ${phoneNumber}!` });

  } catch (error) {
    console.error("❌ Error sending OTP:", error);
    res.status(500).json({ success: false, message: "Error sending OTP", error: error.message || error });
  }
});

// Utility function to generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}



module.exports=router