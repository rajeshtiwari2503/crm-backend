const express=require("express");
const router=express.Router();
 
 const { addServiceRequest,getAllServiceRequest,getServiceRequestById,editServiceRequest,deleteServiceRequest}=require("../controllers/serviceRequestController")

router.post("/addServiceRequest",addServiceRequest );
router.get("/getAllServiceRequest",getAllServiceRequest );
router.get("/getServiceRequest/:id",getServiceRequestById );
router.patch("/editServiceRequest/:id",editServiceRequest );
router.delete("/deleteServiceRequest/:id",deleteServiceRequest );

module.exports=router;