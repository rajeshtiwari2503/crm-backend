const mongoose = require("mongoose");

const stockRequestSchema = new mongoose.Schema({
  serviceCenterId: { type: String, required: true },
  serviceCenterName: { type: String },
  brandId: { type: String },
  brandName: { type: String },
  sparepartId: { type: String },
  sparepartName: { type: String },
  stockId: { type: String },
  fresh: { type: Number, default: 0 },
  defective: { type: Number, default: 0 },
  price: { type: Number },
  title: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const StockRequestModel = mongoose.model("StockRequest", stockRequestSchema);
module.exports = StockRequestModel;
