const mongoose=require("mongoose");

const bankDetailSchema= new mongoose.Schema({
    userId:{type:String,required:true},
    userName:{type:String,required:true},
    bankName:{type:String,required:true},
    accountHolderName:{type:String,required:true},
    accountNumber:{type:String,required:true},
    IFSC:{type:String,required:true},
    commission:{type:Number},
    fund_account_id:{type:String},
    
},{timestamps:true});

const bankDetailModel = new mongoose.model("bankDetail",bankDetailSchema);

module.exports=bankDetailModel;  