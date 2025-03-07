const mongoose=require("mongoose");

const serviceCenterDepositSchema=new mongoose.Schema({
    serviceCenterId:{type:String},
    serviceCenterName:{type:String},
    
    payAmount:{type:Number},
   image:{type:String},
   paymentType:{type:String},
   paymentDate:{type:String},
 
},{timestamps:true})

const ServiceCenterDepositModel=new mongoose.model("ServiceCenterDeposit",serviceCenterDepositSchema);

module.exports=ServiceCenterDepositModel;