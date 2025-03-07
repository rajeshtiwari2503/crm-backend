const express=require("express");
const router=express.Router();
const {upload}  = require("../services/service");

 const { addServicePayment,getAllServicePayment,getServicePaymentById,editServicePayment,deleteServicePayment}=require("../controllers/servicePaymentController")

// router.post("/addServicePayment",addServicePayment );
router.post("/addServicePayment", upload().single("qrCode"),addServicePayment );
router.get("/getAllServicePayment",getAllServicePayment );
router.get("/getServicePayment/:id",getServicePaymentById );
// router.patch("/editServicePayment/:id",editServicePayment );
router.patch("/editServicePayment/:id", upload().single("payScreenshot"),editServicePayment );
router.delete("/deleteServicePayment/:id",deleteServicePayment );

module.exports=router;