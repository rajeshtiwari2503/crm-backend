const express=require("express");
const router=express.Router();
const {upload}  = require("../services/service");

 const { addRecharge,addRechargeByBrand,getAllRecharge,getRechargeById,editRecharge,deleteRecharge}=require("../controllers/brandRechargeController")

router.post("/addRecharge",addRecharge );

router.post("/addRechargeByBrand",upload().single("paymentImage")  , addRechargeByBrand);
 
router.get("/getAllRecharge",getAllRecharge );
router.get("/getRecharge/:id",getRechargeById );
router.patch("/editRecharge/:id",editRecharge );
router.delete("/deleteRecharge/:id",deleteRecharge );

module.exports=router;