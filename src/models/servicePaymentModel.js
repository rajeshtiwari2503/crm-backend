const mongoose = require("mongoose");

const servicePaymentSchema = new mongoose.Schema({
   serviceCenterId: { type: String },
    serviceCenterName: { type: String },
    payment:{ type: String },
    description:{ type: String },
    contactNo:{ type: String },
    complaintId:{ type: String },
    city:{ type: String },
    month:{ type: String },
    address:{ type: String },
    payScreenshot:{ type: String },
    qrCode:{ type: String },
    UPIid:{ type: String },
    status: { type: String, default: "UNPAID" },
}, { timestamps: true })

const servicePaymentModel = new mongoose.model("servicePayment", servicePaymentSchema);

module.exports = servicePaymentModel;