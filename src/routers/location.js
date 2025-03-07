const express=require("express");
const router=express.Router();
 
 const { addLocation,getAllLocation,getLocationById,editLocation,deleteLocation}=require("../controllers/locationController")

router.post("/addLocation",addLocation );
router.get("/getAllLocation",getAllLocation );
router.get("/getLocation/:id",getLocationById );
router.patch("/editLocation/:id",editLocation );
router.delete("/deleteLocation/:id",deleteLocation );

module.exports=router;