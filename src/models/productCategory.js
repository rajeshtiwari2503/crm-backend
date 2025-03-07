const mongoose=require("mongoose");

const productCategorySchema=new mongoose.Schema({
      categoryName:{type:String,required:true},
      // categoryId:{type:String },
      userId:{type:String },
      userName:{type:String },
      adminId:{type:String },
      brandId:{type:String },
      brandName:{type:String },
      status:{type:String ,default:"ACTIVE"}

},{timestamps:true});

const ProductCategoryModel=new mongoose.model("ProductCategory",productCategorySchema);
module.exports=ProductCategoryModel;