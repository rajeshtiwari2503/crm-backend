const mongoose=require("mongoose")

const LocationSchema=mongoose.Schema({
stateName:{type:String,required:true},
zone:{type:String,required:true},
status:{ type:String,default:"ACTIVE"}

},{timestamps:true});
const LocationModel=mongoose.model("Location",LocationSchema)
module.exports=LocationModel;