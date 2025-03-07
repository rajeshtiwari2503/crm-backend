const ProductModel =require("../models/product")

const NotificationModel = require("../models/notification")

const addProduct  = async (req, res) => {
  
        try{
            let body=req.body;
            let data=new ProductModel(body);
            await data.save();
            const notification = new NotificationModel({
               userId: data.userId,
               brandId: data.brandId,
               userName: data.productBrand,
               title: `Add Product By User ${req.body.userName}`,
               message: `A New Product Added in , ${req.body.productBrand} Brand!`,
            });
            await notification.save();
            res.json({status:true,msg:"Product   Added"});
        }catch(err){
            res.status(400).send(err);
        }
 
};

const getAllProduct=async(req,res)=>{
    try{
        let data=await ProductModel.find({}).sort({ _id: -1 });
        res.send(data);
     }catch(err){
        res.status(400).send(err);
     }
}
const getProductById=async(req,res)=>{
    try{
        let _id=req.params.id;
        let data=await ProductModel.findById(_id);
        res.send(data);
     }catch(err){
        res.status(400).send(err);
     }
}

const editProduct=async (req,res)=>{
    try{
        let _id=req.params.id;
        let body=req.body;
        let data=await ProductModel.findByIdAndUpdate(_id,body);
        res.json({status:true,msg:"Product Updated"});
     }catch(err){
        res.status(500).send(err);
     }
}
 const deleteProduct=async(req,res)=>{
    try{
        let _id=req.params.id;
        let data=await ProductModel.findByIdAndDelete(_id);
        const notification = new NotificationModel({
         userId: data.userId,
         brandId: data.brandId,
         userName: data.productBrand,
         title: `Product Deteled By User ${data.userName}`,
         message: `  Product Deteled in , ${data.productBrand} Brand!`,
      });
      await notification.save();
        res.json({status:true,msg:"Product Deteled"});
     }catch(err){
        res.status(500).send(err);
     }
 }

module.exports = { addProduct,getAllProduct,getProductById,editProduct,deleteProduct };
