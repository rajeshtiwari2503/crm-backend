const express = require("express")

const { addNotification,getNotificationByUserId,getNotificationByBrandId,getNotificationByServiceCenterId,getNotificationByTechnicianId,getNotificationByDealerId, getAllNotification, getNotificationById, editNotification, deleteNotification }=require("../controllers/notificationController")

const router=express.Router()

router.post("/addNotification",addNotification)
router.get("/getAllNotification",getAllNotification)
router.get("/getNotificationByUserId/:id",getNotificationByUserId)
router.get("/getNotificationByBrandId/:id",getNotificationByBrandId)
router.get("/getNotificationByServiceCenterId/:id",getNotificationByServiceCenterId)
router.get("/getNotificationByTechnicianId/:id",getNotificationByTechnicianId)
router.get("/getNotificationByDealerId/:id",getNotificationByDealerId)
router.get("/getNotificationById/:id",getNotificationById)
router.patch("/editNotification/:id",editNotification)
router.delete("/deleteNotification/:id",deleteNotification)

module.exports=router