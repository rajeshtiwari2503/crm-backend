const mongoose = require("mongoose");

const serviceCenterStockSchema = new mongoose.Schema({
   serviceCenterId: { type: String },
    serviceCenterName: { type: String },
    freshStock:{ type: String },
    defectiveStock:{ type: String },
    sparepart:{ type: String },
}, { timestamps: true })

const serviceCenterStockModel = new mongoose.model("serviceCenterStock", serviceCenterStockSchema);

module.exports = serviceCenterStockModel;