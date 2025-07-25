const mongoose = require("mongoose");

const userStockSchema = new mongoose.Schema({
   serviceCenterId: { type: String },
   serviceCenterName: { type: String },
   brandId: { type: String },
   brandName: { type: String },
   sparepartName: { type: String },
   sparepartId: { type: String },
   freshStock: { type: Number, default: '0' },
   defectiveStock: { type: Number, default: '0' },
    // sparepart:{ type: String },
    stock: [
        {
          fresh:{type:Number },
          defective:{type:Number },
          title:{type:String },
           price: { type: Number },
 
          createdAt: { type: Date, default: Date.now },
          updatedAt: { type: Date, default: Date.now },
        },
      ],
}, { timestamps: true })

const UserStockModel = new mongoose.model("userStock", userStockSchema);

module.exports = UserStockModel;