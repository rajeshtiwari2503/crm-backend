const mongoose=require("mongoose");

const subCategorySchema=new mongoose.Schema({
      categoryName:{type:String,required:true},
      categoryId:{type:String },
      subCategoryName:{type:String,required:true},
    //   subCategoryId:{type:String },
      userId:{type:String },
      userName:{type:String },
      adminId:{type:String },
      brandId:{type:String },
      brandName:{type:String },
      payout:{type:String },
      stickerPrice:{type:String },
      status:{type:String ,default:"ACTIVE"}

},{timestamps:true});

const SubCategoryModel=new mongoose.model("SubCategory",subCategorySchema);
module.exports=SubCategoryModel;