const mongoose = require("mongoose");

const CourierOrderSchema = new mongoose.Schema({
  customer_code: { type: String, required: true },
  service_type_id: String,
  load_type: String,
  description: String,

  declared_value: Number,
  num_pieces: Number,
  length: Number,
  breadth: Number,
  height: Number,
  weight: Number,

  origin_details: {
    name: String,
    phone: String,
    alt_phone: String,
    address1: String,
    address2: String,
    pincode: String,
    city: String,
    state: String,
  },

  destination_details: {
    name: String,
    phone: String,
    alt_phone: String,
    address1: String,
    address2: String,
    pincode: String,
    city: String,
    state: String,
  },

  return_details: {
    name: String,
    phone: String,
    alt_phone: String,
    address1: String,
    address2: String,
    pincode: String,
    city: String,
    state: String,
  },

  invoice_number: String,
  invoice_date: String,
  reference_number: String,
  customer_reference_number: String,
  cod_collection_mode: String,
  cod_amount: Number,
  commodity_id: String,
  eway_bill: String,
  is_risk_surcharge_applicable: Boolean,

  awb_number: String, // from DTDC response (optional)
  dtdc_response: Object, // full DTDC API response if needed
      spareParts: [
        {
            sparePartId: { type: String, required: true },
            sparePartName: { type: String, required: true },
            quantity: { type: Number, required: true },
            price: { type: Number  },
        }
    ],
    brandId: {
        type: String
    }, brandName: {
        type: String
    },
    serviceCenterId: { type: String, required: true },
    serviceCenter: { type: String, required: true },
 status: { type: String, default: "ORDER" },
  createdAt: {
    type: Date,
    default: Date.now,
  },
},{timestamps:true});

const CourierOrderModal=new mongoose.model("CourierOrder",CourierOrderSchema);

module.exports=CourierOrderModal;
