const SparePartModal =require("../models/sparePart")

const addSparePart  = async (req, res) => {
  
        try{
         let body = req.body;
         let files = req.files;
         let images = files?.map(f1 => f1.location);
         let obj = new SparePartModal({ ...body, images: images });
            await data.save();
            res.json({status:true,msg:"SparePart   Added"});
        }catch(err){
            res.status(400).send(err);
        }
 
};

const getAllSparePart=async(req,res)=>{
    try{
        let data=await SparePartModal.find({}).sort({ _id: -1 });
        res.send(data);
     }catch(err){
        res.status(400).send(err);
     }
}
const getSparePartById=async(req,res)=>{
    try{
        let _id=req.params.id;
        let data=await SparePartModal.findById(_id);
        res.send(data);
     }catch(err){
        res.status(400).send(err);
     }
}

const editSparePart=async (req,res)=>{
    try{
        let _id=req.params.id;
        let body=req.body;
        let data=await SparePartModal.findByIdAndUpdate(_id,body);
        res.json({status:true,msg:"SparePart Updated"});
     }catch(err){
        res.status(500).send(err);
     }
}
 const deleteSparePart=async(req,res)=>{
    try{
        let _id=req.params.id;
        let data=await SparePartModal.findByIdAndDelete(_id);
        res.json({status:true,msg:"SparePart Deteled"});
     }catch(err){
        res.status(500).send(err);
     }
 }

module.exports = { addSparePart,getAllSparePart,getSparePartById,editSparePart,deleteSparePart };
