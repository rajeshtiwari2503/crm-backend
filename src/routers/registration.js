const express=require("express");
const router = express.Router();
const { upload} = require("../services/service");

const {getProfileById,adminLoginController,dashboardLoginController,brandRegistration,serviceRegistration,empolyeeRegistration,dealerRegistration, adminRegistration,userRegistration,
  brandEmpolyeeRegistration,getAllBrandEmployee,getBrandEmployeeById,editBrandEmployee,deleteBrandEmployee,
  getAllBrand,getBrandById,getUserServerById,editBrand,updateBrandTerms,deleteBrand,getAllServiceCenterAction,getAllServiceCenter,getServiceCenterById,editServiceCenter,deleteServiceCenter,
getAllEmployee,getEmployeeById,editEmployee,deleteEmployee ,getAllDealer,getDealerById,editDealer,deleteDealer,getAllUser,
getUserById,editUser,deleteUser,otpVerification,otpVerificationSending,forgetPassword,mobileEmailVerification,
otpSending,
editServiceCenterStatusUpdate}=require("../controllers/registrationController")
const RegistrationModel=require("../models/registration");
const {BrandRegistrationModel}=require("../models/registration");
const {ServiceModel}=require("../models/registration");


 
router.post("/registration", adminRegistration
);

router.post("/brandRegistration", brandRegistration
);
router.post("/serviceRegistration", serviceRegistration
);
router.post("/employeeRegistration", empolyeeRegistration
);
router.post("/brandEmployeeRegistration", brandEmpolyeeRegistration
);
router.post("/dealerRegistration", dealerRegistration
);
router.post("/userRegistration", userRegistration
); 

router.post("/login",adminLoginController )
router.post("/dashboardLogin",dashboardLoginController )
router.get("/getAllBrand",getAllBrand )
router.get("/getBrandBy/:id",getBrandById )
router.patch("/editBrand/:id",editBrand )
router.patch("/updateBrandTerms/:id",updateBrandTerms )
router.delete("/deleteBrand/:id",deleteBrand )
 
router.get("/getProfileById/:id",getProfileById )
router.get("/getUserServerById/:id",getUserServerById )


router.get("/getAllService",getAllServiceCenter )
router.get("/getAllServiceCenterAction",getAllServiceCenterAction )
router.get("/getServiceBy/:id",getServiceCenterById )
router.patch("/editServiceCenterStatusUpdate/:id",editServiceCenterStatusUpdate )
router.patch("/editService/:id",editServiceCenter )
router.delete("/deleteService/:id",deleteServiceCenter )

router.get("/getAllEmployee",getAllEmployee )
router.get("/getEmployeeBy/:id",getEmployeeById )
router.patch("/editEmployee/:id",editEmployee )
router.delete("/deleteEmployee/:id",deleteEmployee )

router.get("/getAllEmployee",getAllBrandEmployee )
router.get("/getEmployeeBy/:id",getBrandEmployeeById )
router.patch("/editEmployee/:id",editBrandEmployee )
router.delete("/deleteEmployee/:id",deleteBrandEmployee )

router.get("/getAllDealer",getAllDealer )
router.get("/getDealerBy/:id",getDealerById )
router.patch("/editDealer/:id",editDealer )
router.delete("/deleteDealer/:id",deleteDealer )

router.get("/getAllUser",getAllUser )
router.get("/getUserBy/:id",getUserById )
router.patch("/editUser/:id",editUser )
router.delete("/deleteUser/:id",deleteUser )


 
router.get("/getAllBrand",getAllBrand);

router.get("/getAllUser",async(req,res)=>{
    try{
      const data=await RegistrationModel.find({});
      res.send(data);
    }catch(err){
      res.status(400).send(err);
    }
});

 

router.patch("/editBrandBy/:id",async(req,res)=>{
  try{
    const body=req.body;
    let _id=req.params.id; 
    const data=await RegistrationModel.findByIdAndUpdate(_id,body);
    res.json({status:true,msg:"Updated"});
  }catch(err){
    res.status(500).send(err);
  }
});
router.patch("/uploadBrandLogo/:id", upload().single("brandLogo"), async (req, res) => {
  try {
      let _id = req.params.id;
      let obj = await BrandRegistrationModel.findById(_id);
      obj.images = req.file.location;
      
      let obj1 = await BrandRegistrationModel.findByIdAndUpdate(_id, { brandLogo: obj.images }, { new: true });
      res.json({ status: true, msg: "Logo Uploaded Successfully", data: obj1 });
  } catch (err) {
      res.status(500).send(err);
  }
});
router.patch("/uploadCenterQrCode/:id", upload().single("qrCode"), async (req, res) => {
  try {
      let _id = req.params.id;
      let obj = await ServiceModel.findById(_id);
      obj.images = req.file.location;
      
      let obj1 = await ServiceModel.findByIdAndUpdate(_id, { qrCode: obj.images }, { new: true });
      res.json({ status: true, msg: "Qr Code Uploaded Successfully", data: obj1 });
  } catch (err) {
      res.status(500).send(err);
  }
});
router.patch("/uploadCenterUPIid/:id", async (req, res) => {
  try {
    const _id = req.params.id;
    const { UPIid } = req.body; // Expecting UPIid in request body

    if (!UPIid) {
      return res.status(400).json({ status: false, msg: "UPI ID is required" });
    }

    const updatedService = await ServiceModel.findByIdAndUpdate(
      _id,
      { UPIid },
      { new: true }
    );

    if (!updatedService) {
      return res.status(404).json({ status: false, msg: "Service Center not found" });
    }

    res.json({
      status: true,
      msg: "UPI ID updated successfully",
      data: updatedService
    });
  } catch (err) {
    res.status(500).json({ status: false, msg: "Internal Server Error", error: err.message });
  }
});

router.patch("/uploadCenterGstCertificate/:id", upload().single("gstCertificate"), async (req, res) => {
  try {
      let _id = req.params.id;
      let obj = await ServiceModel.findById(_id);
      obj.images = req.file.location;
      
      let obj1 = await ServiceModel.findByIdAndUpdate(_id, { gstCertificate: obj.images }, { new: true });
      res.json({ status: true, msg: "Gst Certificate Uploaded Successfully", data: obj1 });
  } catch (err) {
      res.status(500).send(err);
  }
});
router.patch("/uploadCenterIdentityProof/:id", upload().single("identityProof"), async (req, res) => {
  try {
      let _id = req.params.id;
      let obj = await ServiceModel.findById(_id);
      obj.images = req.file.location;
      
      let obj1 = await ServiceModel.findByIdAndUpdate(_id, { identityProof: obj.images }, { new: true });
      res.json({ status: true, msg: "Identity Proof Uploaded Successfully", data: obj1 });
  } catch (err) {
      res.status(500).send(err);
  }
});
router.patch("/uploadCenterCertificationDocuments/:id", upload().single("certificationDocuments"), async (req, res) => {
  try {
      let _id = req.params.id;
      let obj = await ServiceModel.findById(_id);
      obj.images = req.file.location;
      
      let obj1 = await ServiceModel.findByIdAndUpdate(_id, { certificationDocuments: obj.images }, { new: true });
      res.json({ status: true, msg: "Certification Documents Uploaded Successfully", data: obj1 });
  } catch (err) {
      res.status(500).send(err);
  }
});

// router.patch('/updateServiceCenterpincode/:id', async (req, res) => {
//   try {
//     const { pincodes } = req.body;
//     const { id } = req.params;

//     if (!pincodes) {
//       return res.json({ status:true,msg: 'Pincode is required' });
//     }

//     // Find service center by ID and update
//     const updatedServiceCenter = await ServiceModel.findByIdAndUpdate(
//       id,
//       { $push: { pincodeSupported: pincodes } },  // Push pincode to the array
//       { new: true, useFindAndModify: false }
//     );

//     if (!updatedServiceCenter) {
//       return res.json({ status:true,msg: 'Service Center not found' });
//     }

//     res.json({status:true,msg: 'Pincode added successfully', data: updatedServiceCenter });
//   } catch (error) {
//     res.status(500).json({status:false,msg: 'Server error', error });
//   }
// });

router.patch('/updateServiceCenterpincode/:id', async (req, res) => {
  try {
    let { pincodes } = req.body; // Expecting a comma-separated string of pincodes
    const { id } = req.params;

    if (!pincodes || typeof pincodes !== 'string') {
      return res.json({ status: false, msg: 'Pincode is required and should be a comma-separated string' });
    }

    // Convert the comma-separated string into an array of 6-digit pincodes
    const pincodeArray = pincodes.split(',').map(pincode => pincode.trim()).filter(pincode => pincode.length === 6);

    if (pincodeArray.length === 0) {
      return res.json({ status: false, msg: 'No valid 6-digit pincodes found' });
    }

    // Add the array of pincodes to the pincodeSupported field in the Service Center
    const updatedServiceCenter = await ServiceModel.findByIdAndUpdate(
      id,
      { $addToSet: { pincodeSupported: { $each: pincodeArray } } },  // $addToSet with $each to insert array at once
      { new: true, useFindAndModify: false }
    );

    if (!updatedServiceCenter) {
      return res.json({ status: false, msg: 'Service Center not found' });
    }

    res.json({ status: true, msg: 'Pincodes added successfully', data: updatedServiceCenter });
  } catch (error) {
    res.status(500).json({ status: false, msg: 'Server error', error });
  }
});





router.delete("/deleteBrandBy/:id",async(req,res)=>{
  try{
    let _id=req.params.id; 
    const data=await RegistrationModel.findByIdAndDelete(_id);
    res.json({status:true,msg:"Delete"});
  }catch(err){
    res.status(500).send(err);
  }
});


router.post("/sendOtp",otpSending);
router.post("/otpVerification",otpVerification);
router.post("/mobileEmailSendOtp",otpVerificationSending);
router.post("/mobileEmailOtpVerification",mobileEmailVerification);

router.patch("/forgetPassword",forgetPassword )
 
module.exports=router;