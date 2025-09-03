
const mongoose = require("mongoose")

function generateAlphanumericId(length) {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
}
const productWarrantySchema = new mongoose.Schema({
  brandName: { type: String },
  brandId: { type: String },
  productName: { type: String },
  productId: { type: String },
  categoryId: { type: String },
  productId: { type: String },
  categoryName: { type: String },
  subCategoryId: { type: String },
  subCategoryName: { type: String },
  numberOfGenerate: Number,
  warrantyInDays: Number,
  year: { type: Date },
  isDeleted: {
    type: Boolean,
    default: false
  },
  id: mongoose.Schema.Types.ObjectId, // Reference to the first record's ID or a unique identifier
  records: [{
    brandName: { type: String },
    brandId: { type: String },
    productName: { type: String },
    productId: { type: String },
    categoryId: { type: String },
    categoryName: { type: String },
    subCategoryId: { type: String },
    subCategoryName: { type: String },
    productId: { type: String },

    uniqueId: { type: String },
    year: { type: Date },
    batchNo: { type: String },
    warrantyInDays: Number,
    qrCodes: [{ qrCodeUrl: { type: String }, index: Number }],
    userId: String,
    userName: String,
    email: String,
    contact: String,
    address: String,
    lat: String,
    long: String,
    pincode: String,
    district: String,
    state: String,
    complaintId: String,

    termsCondtions: { type: Boolean, default: false },
    isActivated: { type: Boolean, default: false },
    activationDate: Date,
  }],

}, { timestamps: true })

const ProductWarrantyModal = new mongoose.model("ProductWarranty", productWarrantySchema);

module.exports = ProductWarrantyModal;