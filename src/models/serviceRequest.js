const mongoose=require("mongoose")

const ServiceRequestSchema=mongoose.Schema({
 
applianceType: {type:String },
serviceType: {type:String },
pinCode: {type:String },
contactNumber: {type:String },
name: {type:String },
email: {type:String },
phone: {type:String },
message: {type:String },


},{timestamps:true});
const ServiceRequestModel=mongoose.model("ServiceRequest",ServiceRequestSchema)
module.exports=ServiceRequestModel;  