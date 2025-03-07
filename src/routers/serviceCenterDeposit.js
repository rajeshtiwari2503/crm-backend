const express=require("express");
const router=express.Router();
 const {upload}=require("../services/service")
 const { addServiceCenterDeposit,getAllServiceCenterDeposit,getServiceCenterAllDepositById,getServiceCenterDepositById,editServiceCenterDeposit,deleteServiceCenterDeposit}=require("../controllers/serviceCenterDepositController")

router.post("/addServiceCenterDeposit",upload().single("image"), addServiceCenterDeposit );
router.get("/getAllServiceCenterDeposit",getAllServiceCenterDeposit );
router.get("/getServiceCenterAllDeposit/:id",getServiceCenterAllDepositById );
router.get("/getServiceCenterDeposit/:id",getServiceCenterDepositById );
router.patch("/editServiceCenterDeposit/:id",editServiceCenterDeposit );
router.delete("/deleteServiceCenterDeposit/:id",deleteServiceCenterDeposit );

module.exports=router;