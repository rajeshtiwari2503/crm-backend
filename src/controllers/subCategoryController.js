const SubCategoryModal =require("../models/subCategory")

const addSubCategory  = async (req, res) => {
  
        try{
            let body=req.body;
            let data=new SubCategoryModal(body);
            await data.save();
            res.json({status:true,msg:"SubCategory   Added"});
        }catch(err){
            res.status(400).send(err);
        }
 
};

const getAllSubCategory=async(req,res)=>{
    try{
        let data=await SubCategoryModal.find({}).sort({ _id: -1 });
        res.send(data);
     }catch(err){
        res.status(400).send(err);
     }
}
const getSubCategoryByCateId=async(req,res)=>{
   try{
      let _id=req.params.id;
       let data=await SubCategoryModal.find({categoryId:_id}).sort({ _id: -1 });
       res.send(data);
    }catch(err){
       res.status(400).send(err);
    }
}
const getSubCategoryById=async(req,res)=>{
    try{
        let _id=req.params.id;
        let data=await SubCategoryModal.findById(_id);
        res.send(data);
     }catch(err){
        res.status(400).send(err);
     }
}

const editSubCategory=async (req,res)=>{
    try{
        let _id=req.params.id;
        let body=req.body;
        let data=await SubCategoryModal.findByIdAndUpdate(_id,body);
        res.json({status:true,msg:"Complaint Nature Updated"});
     }catch(err){
        res.status(500).send(err);
     }
}
 const deleteSubCategory=async(req,res)=>{
    try{
        let _id=req.params.id;
        let data=await SubCategoryModal.findByIdAndDelete(_id);
        res.json({status:true,msg:"Complaint Nature Deteled"});
     }catch(err){
        res.status(500).send(err);
     }
 }

module.exports = { addSubCategory,getAllSubCategory,getSubCategoryByCateId,getSubCategoryById,editSubCategory,deleteSubCategory };
