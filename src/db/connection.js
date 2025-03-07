const mongoose=require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URL,{
   useNewUrlParser:true,
   useUnifiedTopology:true
}).then(()=>{
    console.log("Connection successful");
}).catch((err)=>{
    console.log("No connection",err);
});