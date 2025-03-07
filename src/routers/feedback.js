const express = require("express")

const {addFeedback,getFeedbackByUserId,getFeedbackByBrandId,getFeedbackByTechnicianId,getFeedbackByServiceCenterId
,    getAllFeedback, getFeedbackById, editFeedback, deleteFeedback}=require("../controllers/feedbackController")

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

module.exports=router