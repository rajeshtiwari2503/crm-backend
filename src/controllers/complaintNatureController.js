const ComplaintNatureModal =require("../models/complaintNature")

const addComplaintNature  = async (req, res) => {
  
        try{
            let body=req.body;
            let data=new ComplaintNatureModal(body);
            await data.save();
            res.json({status:true,msg:"ComplaintNature   Added"});
        }catch(err){
            res.status(400).send(err);
        }
 
};

const getAllComplaintNature=async(req,res)=>{
    try{
        let data=await ComplaintNatureModal.find({}).sort({ _id: -1 });
        res.send(data);
     }catch(err){
        res.status(400).send(err);
     }
}
const getComplaintNatureById=async(req,res)=>{
    try{
        let _id=req.params.id;
        let data=await ComplaintNatureModal.findById(_id);
        res.send(data);
     }catch(err){
        res.status(400).send(err);
     }
}

const editComplaintNature=async (req,res)=>{
    try{
        let _id=req.params.id;
        let body=req.body;
        let data=await ComplaintNatureModal.findByIdAndUpdate(_id,body);
        res.json({status:true,msg:"Complaint Nature Updated"});
     }catch(err){
        res.status(500).send(err);
     }
}
 const deleteComplaintNature=async(req,res)=>{
    try{
        let _id=req.params.id;
        let data=await ComplaintNatureModal.findByIdAndDelete(_id);
        res.json({status:true,msg:"Complaint Nature Deteled"});
     }catch(err){
        res.status(500).send(err);
     }
 }

module.exports = { addComplaintNature,getAllComplaintNature,getComplaintNatureById,editComplaintNature,deleteComplaintNature };
