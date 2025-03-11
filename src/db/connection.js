// const mongoose=require("mongoose");
// require("dotenv").config();

// mongoose.connect(process.env.MONGO_URL,{
//    useNewUrlParser:true,
//    useUnifiedTopology:true
// }).then(()=>{
//     console.log("Connection successful");
// }).catch((err)=>{
//     console.log("No connection",err);
// });

const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds instead of default 10s
      socketTimeoutMS: 45000, // 45 seconds to keep socket open
    });
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1); // Exit process with failure
  }
};

connectDB();
