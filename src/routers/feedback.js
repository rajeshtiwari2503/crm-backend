const express = require("express")

const {addFeedback,getFeedbackByUserId,getAllBrandFeedback,getFeedbackByBrandId,getFeedbackByTechnicianId,getFeedbackByServiceCenterId
,    getAllFeedback, getFeedbackById, editFeedback, deleteFeedback}=require("../controllers/feedbackController")
const BrandFeedback = require("../models/brandFeedbackModel")
 

const router=express.Router()

router.post("/addFeedback",addFeedback)
router.get("/getAllFeedback",getAllFeedback)
router.get("/getFeedbackByUserId/:id",getFeedbackByUserId)
router.get("/getFeedbackByBrandId/:id",getFeedbackByBrandId)
router.get("/getFeedbackByTechnicianId/:id",getFeedbackByTechnicianId)
router.get("/getFeedbackByServiceCenterId/:id",getFeedbackByServiceCenterId)
router.get("/getFeedbackById/:id",getFeedbackById)
router.patch("/editFeedback/:id",editFeedback)
router.delete("/deleteFeedback/:id",deleteFeedback)

router.get("/getAllBrandFeedback",getAllBrandFeedback)
router.post("/submit-feedback", async (req, res) => {
  try {
    const feedback = new BrandFeedback(req.body);
    await feedback.save();
    res.status(200).json({ message: "Feedback submitted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error submitting feedback.", error });
  }
});
module.exports=router