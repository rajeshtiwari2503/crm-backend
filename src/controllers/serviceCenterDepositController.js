const ServiceCenterDepositModal =require("../models/serviceCenterDepositModel")

const addServiceCenterDeposit  = async (req, res) => {
  
        try{
         let body = req.body;
         
         let image = req?.file?.location;
         let data = new ServiceCenterDepositModal({ ...body, image: image });
            await data.save();
            res.json({status:true,msg:"Service Center Deposit   Added"});
        }catch(err){
            res.status(400).send(err);
        }
 
};

// Using req.params
const getAllServiceCenterDeposit = async (req, res) => {
   try{
      let data=await ServiceCenterDepositModal.find({}).sort({ _id: -1 });
      res.send(data);
   }catch(err){
      res.status(400).send(err);
   }
};

const getServiceCenterAllDepositById=async(req,res)=>{
  
    try {
     
      let serviceCenterId=req.params.id;  // Use req.params if passed in the path
      let data = await ServiceCenterDepositModal.find({ serviceCenterId }).sort({ _id: -1 });
      res.send(data);
  } catch (err) {
      res.status(400).send(err);
  }
}
const getServiceCenterDepositById=async(req,res)=>{
    try{
        let _id=req.params.id;
        let data=await ServiceCenterDepositModal.findById(_id);
        res.send(data);
     }catch(err){
        res.status(400).send(err);
     }
}

const editServiceCenterDeposit=async (req,res)=>{
    try{
        let _id=req.params.id;
        let body=req.body;
        let data=await ServiceCenterDepositModal.findByIdAndUpdate(_id,body);
        res.json({status:true,msg:"Service Center Deposit Updated"});
     }catch(err){
        res.status(500).send(err);
     }
}
 const deleteServiceCenterDeposit=async(req,res)=>{
    try{
        let _id=req.params.id;
        let data=await ServiceCenterDepositModal.findByIdAndDelete(_id);
        res.json({status:true,msg:"Service Center Deposit Deteled"});
     }catch(err){
        res.status(500).send(err);
     }
 }

module.exports = { addServiceCenterDeposit,getAllServiceCenterDeposit,getServiceCenterAllDepositById,getServiceCenterDepositById,editServiceCenterDeposit,deleteServiceCenterDeposit };
