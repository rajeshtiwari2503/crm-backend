const mongoose=require("mongoose");

const brandTransactionSchema=new mongoose.Schema({
    brandId:{type:String},
    brandName:{type:String},
     creaditAmmount:{type:String},
     debitAmmount:{type:String},
     title:{type:String},
},{timestamps:true})

const BrandTransactionModel=new mongoose.model("brandTransaction",brandTransactionSchema);

module.exports=BrandTransactionModel;