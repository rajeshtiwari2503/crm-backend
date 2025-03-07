const mongoose = require("mongoose");

const brandStockSchema = new mongoose.Schema({
   brandId: { type: String },
    brandName: { type: String },
    freshStock: { type: Number, default: '0' },
    defectiveStock: { type: Number, default: '0' },
    sparepartName:{ type: String },
    sparepartId:{ type: String },
    stock: [
        {
          fresh:{type:Number },
          defective:{type:Number },
          title:{type:String },
          createdAt: { type: Date, default: Date.now },
          updatedAt: { type: Date, default: Date.now },
        },
      ],
}, { timestamps: true })

const BrandStockModel = new mongoose.model("brandStock", brandStockSchema);

module.exports = BrandStockModel;