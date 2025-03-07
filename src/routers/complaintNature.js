const express = require("express")

const {addComplaintNature,getAllComplaintNature,getComplaintNatureById,editComplaintNature,deleteComplaintNature}=require("../controllers/complaintNatureController")

const router=express.Router()

router.post("/addComplaintNature",addComplaintNature)
router.get("/getAllComplaintNature",getAllComplaintNature)
router.get("/getComplaintNatureById/:id",getComplaintNatureById)
router.patch("/editComplaintNature/:id",editComplaintNature)
router.delete("/deleteComplaintNature/:id",deleteComplaintNature)

module.exports=router;