const express = require("express")

const {addComplaint,addDealerComplaint,getComplaintsByAssign,getComplaintsByCancel,getComplaintsByComplete
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