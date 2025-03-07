const express = require("express")

const {addTechnician,getAllTechnician,getComplaintByCenterId,getTechnicianById,editTechnician,deleteTechnician}=require("../controllers/technicianController")

const router=express.Router()

router.post("/addTechnician",addTechnician)
router.get("/getAllTechnician",getAllTechnician)
router.get("/getTechnicianById/:id",getTechnicianById)
router.get("/getTechnicianByCenterId/:id",getComplaintByCenterId)
router.patch("/editTechnician/:id",editTechnician)
router.delete("/deleteTechnician/:id",deleteTechnician)

module.exports=router