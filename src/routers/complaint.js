const express = require("express")
const ComplaintModal = require("../models/complaint")

const {addComplaint,addDealerComplaint,getAllComplaintByRole,getComplaintsByAssign,getComplaintsByCancel,getComplaintsByComplete
    ,getComplaintsByInProgress,getComplaintsByUpcomming,getComplaintsByPartPending,getComplaintsByPending,getComplaintsByFinalVerification, 
    getPendingComplaints,getPartPendingComplaints,addAPPComplaint,getAllComplaint,getComplaintById,getComplaintByTechId,getComplaintByUserId,updateComplaintComments,editIssueImage ,updateFinalVerification,editComplaint,deleteComplaint,updateComplaint}=require("../controllers/complaintController")
const {upload}  = require("../services/service");
 
 
const router=express.Router()

router.post("/createComplaint",upload().single("issueImages")  , addComplaint);
// router.post("/createAppComplaint",upload().single("issueImages")  , addAPPComplaint);
router.post("/createAppComplaint" , addAPPComplaint);
router.post("/createDealerComplaint",upload().single("warrantyImage")  , addDealerComplaint);
 
// router.post("/createComplaint",  addComplaint);
router.get("/getAllComplaint",getAllComplaint)
router.get("/getAllComplaintByRole",getAllComplaintByRole)

router.get("/getComplaintsByAssign",getComplaintsByAssign)
router.get("/getComplaintsByCancel",getComplaintsByCancel)
router.get("/getComplaintsByComplete",getComplaintsByComplete)
router.get("/getComplaintsByInProgress",getComplaintsByInProgress)
router.get("/getComplaintsByUpcomming",getComplaintsByUpcomming)
router.get("/getComplaintsByPartPending",getComplaintsByPartPending)
router.get("/getComplaintsByPending",getComplaintsByPending)
router.get("/getComplaintsByFinalVerification",getComplaintsByFinalVerification)
 
router.get("/getComplaintById/:id",getComplaintById)
router.get("/getPendingComplaints/:days",getPendingComplaints)
router.get("/getPartPendingComplaints/:days",getPartPendingComplaints)
router.get("/getComplaintByUserId/:id",getComplaintByUserId)
router.get("/getComplaintByTechId/:id",getComplaintByTechId)
router.patch("/editImage/:id", upload().single("issueImages"),editIssueImage );
router.patch("/updateFinalVerification/:id", upload().single("partImage"),updateFinalVerification );
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
console.log("trimmedSearchTerm",trimmedSearchTerm);

  //  ✅ Search by phone number (Regex for case-insensitive match)
    searchConditions.push({ phoneNumber:trimmedSearchTerm });
    
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




// router.post('/createComplaint', upload().array('images'), async (req, res) => {
//     try {
//       let body = req.body;
//       let files = req.files;
//       let images = files.map(file => file.location);
//       let obj = new SparePartModal({ ...body, images });
//       let data = await obj.save();
//       res.json({ status: true, msg: "Spare part added successfully", data });
//     } catch (err) {
//       res.status(400).send(err);
//     }
//   });
module.exports=router