const axios = require('axios');
const CourierOrderModal = require('../models/courierOrderModel');
const BrandStockModel = require('../models/brandStock');
const UserStockModel = require('../models/userStock');
 


// Customer Code: GL017
// API-KEY: da66dccac00b76c795e827ffaafd5d
// Service_type_id: B2C SMART EXPRESS, B2C PRIORITY
// X-Access-Token: GL017_trk_json:521ce7881cb576b9a084489e02534e2e
// Tracking Username: GL017_trk_json
// Tracking Password: 4Fcc8


const DTDC_API_URL = 'https://demodashboardapi.shipsy.in/api/customer/integration/consignment/softdata';
const API_TOKEN = 'da66dccac00b76c795e827ffaafd5d'; // Replace with actual token
const Access_Token = 'GL017_trk_json:521ce7881cb576b9a084489e02534e2e'; // Replace with actual token
const TRACK_USERNAME = 'GL017_trk_json';
const TRACK_PASSWORD = '4Fcc8';
const CUSTOMER_CODE = 'GL017';

// const createConsignmentDTDC = async (req, res) => {
//   try {
//     const data = req.body;
//     // console.log("📥 Incoming Payload:", data);

//     // Build payload
//     const payload = {
//       customer_code: CUSTOMER_CODE,
//       service_type_id: data.service_type_id || 'B2C PRIORITY',
//       load_type: data.load_type || 'NON-DOCUMENT',
//       description: data.description || 'Shipment',

//       declared_value: parseFloat(data.declared_value || 0),
//       num_pieces: parseInt(data.num_pieces || 1),
//       length: parseInt(data.length || 1),
//       breadth: parseInt(data.breadth || 1),
//       height: parseInt(data.height || 1),
//       weight: parseFloat(data.weight || 0.5),

//       origin_details: {
//         name: data.origin_details?.name,
//         phone: data.origin_details?.phone,
//         alt_phone: data.origin_details?.alt_phone,
//         address1: data.origin_details?.address1,
//         address2: data.origin_details?.address2,
//         pincode: data.origin_details?.pincode,
//         city: data.origin_details?.city,
//         state: data.origin_details?.state,
//       },

//       destination_details: {
//         name: data.destination_details?.name,
//         phone: data.destination_details?.phone,
//         alt_phone: data.destination_details?.alt_phone,
//         address1: data.destination_details?.address1,
//         address2: data.destination_details?.address2,
//         pincode: data.destination_details?.pincode,
//         city: data.destination_details?.city,
//         state: data.destination_details?.state,
//       },

//       return_details: {
//         name: data.return_details?.name,
//         phone: data.return_details?.phone,
//         alt_phone: data.return_details?.alt_phone,
//         address1: data.return_details?.address1,
//         address2: data.return_details?.address2,
//         pincode: data.return_details?.pincode,
//         city: data.return_details?.city,
//         state: data.return_details?.state,
//       },
//     spareParts: data.spareParts || [],
//       brandId: data.brandId,
//       brandName: data.brandName,
//       serviceCenterId: data.serviceCenterId,
//       serviceCenter: data.serviceCenter,

      
//       invoice_number: data.invoice_number,
//       invoice_date: data.invoice_date,
//       reference_number: data.reference_number,
//       customer_reference_number: data.customer_reference_number,
//       cod_collection_mode: data.cod_collection_mode,
//       cod_amount: data.cod_amount,
//       commodity_id: data.commodity_id,
//       eway_bill: data.eway_bill,
//       is_risk_surcharge_applicable: data.is_risk_surcharge_applicable === 'true',
//     };

//     // console.log("📤 Sending to DTDC:", DTDC_API_URL, payload);

//     const response = await axios.post(DTDC_API_URL, payload, {
//       headers: {
//         'Content-Type': 'application/json',
//         'API-KEY': API_TOKEN,                     // Your API key
//         'X-Access-Token': Access_Token // Your access token
//       },
//     });
//  // ✅ Store order in MongoDB
//     const awbNumber = response.data?.data?.[0]?.reference_number || null;

//     const newOrder = new CourierOrderModal({
//       ...payload,
//       awb_number: awbNumber,
//       dtdc_response: response.data, // optional
//     });

//     await newOrder.save();
//     return res.json({
//       message: 'Consignment created successfully',
//       dtdcResponse: response.data,
//     });
//   } catch (error) {
//     console.error('DTDC API Error:', error.response?.data || error.message);
//     return res.status(500).json({
//       message: 'Error creating consignment',
//       error: error.response?.data || error.message,
//     });
//   }
// };




const createConsignmentDTDC = async (req, res) => {
  try {
    const data = req.body;
    let {
      spareParts,
      brandApproval,
      serviceCenterId,
      serviceCenter,
      docketNo,
      trackLink,
      brandId,
      brandName,
    } = data;

    // Parse spareParts if sent as JSON string
    if (typeof spareParts === "string") {
      try {
        spareParts = JSON.parse(spareParts);
      } catch {
        return res.status(400).json({ status: false, msg: "Invalid spareParts format" });
      }
    }

    if (!Array.isArray(spareParts) || spareParts.length === 0) {
      return res.status(400).json({ status: false, msg: "No spare parts selected" });
    }

    const chalanImage = req.file ? req.file.location : null;

    // Stock check and order creation
    for (const part of spareParts) {
      const { sparePartId, quantity } = part;
      const numericQty = parseInt(quantity, 10) || 0;

      const sparePart = await BrandStockModel.findOne({ sparepartId: sparePartId });
      if (!sparePart) {
        return res.status(404).json({ status: false, msg: `Spare part not found: ${sparePartId}` });
      }

      const freshStock = parseInt(sparePart.freshStock, 10) || 0;
      if (freshStock < numericQty) {
        return res.status(400).json({ status: false, msg: `Insufficient stock for ${sparePart.sparePartName}` });
      }
    }

    const newOrder = await OrderModel.create({
      spareParts,
      brandId,
      brandName,
      serviceCenterId,
      serviceCenter,
      docketNo,
      brandApproval,
      trackLink,
      chalanImage,
    });

    // Prepare stock updates
    const brandStockUpdates = [];
    const userStockUpdates = [];

    for (const part of spareParts) {
      const { sparePartId, quantity, sparePartName } = part;
      const numericQty = parseInt(quantity, 10) || 0;

      brandStockUpdates.push(
        {
          updateOne: {
            filter: { sparepartId: sparePartId },
            update: { $inc: { freshStock: -numericQty } },
          },
        },
        {
          updateOne: {
            filter: { sparepartId: sparePartId },
            update: {
              $push: {
                stock: {
                  fresh: -numericQty,
                  title: "Admin Order",
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              },
            },
          },
        }
      );

      // Update or create user stock
      const existingUserStock = await UserStockModel.findOne({ serviceCenterId, sparepartId: sparePartId });

      if (existingUserStock) {
        userStockUpdates.push({
          updateOne: {
            filter: { serviceCenterId, sparepartId: sparePartId },
            update: {
              $inc: { freshStock: numericQty },
              $push: {
                stock: {
                  fresh: numericQty,
                  title: "Admin Order",
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              },
            },
          },
        });
      } else {
        await UserStockModel.create({
          serviceCenterId,
          serviceCenterName: serviceCenter,
          sparepartId: sparePartId,
          sparepartName: sparePartName,
          brandId,
          brandName,
          freshStock: numericQty,
          stock: [
            {
              fresh: numericQty,
              title: "Admin Order",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        });
      }
    }

    if (brandStockUpdates.length > 0) await BrandStockModel.bulkWrite(brandStockUpdates);
    if (userStockUpdates.length > 0) await UserStockModel.bulkWrite(userStockUpdates);

    // --- Build DTDC Payload ---
    const payload = {
      customer_code: CUSTOMER_CODE,
      service_type_id: data.service_type_id || "B2C PRIORITY",
      load_type: data.load_type || "NON-DOCUMENT",
      description: data.description || "Shipment",

      declared_value: parseFloat(data.declared_value || 0),
      num_pieces: parseInt(data.num_pieces || 1),
      length: parseInt(data.length || 1),
      breadth: parseInt(data.breadth || 1),
      height: parseInt(data.height || 1),
      weight: parseFloat(data.weight || 0.5),

      origin_details: data.origin_details,
      destination_details: data.destination_details,
      return_details: data.return_details,

      invoice_number: data.invoice_number,
      invoice_date: data.invoice_date,
      reference_number: data.reference_number,
      customer_reference_number: data.customer_reference_number,
      cod_collection_mode: data.cod_collection_mode,
      cod_amount: data.cod_amount,
      commodity_id: data.commodity_id,
      eway_bill: data.eway_bill,
      is_risk_surcharge_applicable: data.is_risk_surcharge_applicable === "true",

      spareParts,
      brandId,
      brandName,
      serviceCenterId,
      serviceCenter,
    };

    // 🔗 Send to DTDC
    const dtdcResponse = await axios.post(DTDC_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "API-KEY": API_TOKEN,
        "X-Access-Token": Access_Token,
      },
    });

    const awbNumber = dtdcResponse.data?.data?.[0]?.reference_number || null;

    // 📦 Save Courier Order
    await CourierOrderModal.create({
      ...payload,
      awb_number: awbNumber,
      dtdc_response: dtdcResponse.data,
    });

    return res.status(200).json({
      message: "✅ Consignment created & order saved",
      dtdcResponse: dtdcResponse.data,
    });
  } catch (error) {
    console.error("❌ DTDC API Error:", error.response?.data || error.message);
    return res.status(500).json({
      message: "Error creating consignment",
      error: error.response?.data || error.message,
    });
  }
};




// 🧾 Generate Shipping Label (PDF)
const generateLabel = async (req, res) => {
  try {
    const { reference_number, label_code = 'SHIP_LABEL_4X6', label_format = 'pdf' } = req.query;

    const response = await axios.get(
      'https://pxapi.dtdc.in/api/customer/integration/consignment/shippinglabel/stream',
      {
        params: { reference_number, label_code, label_format },
        headers: { 'api-key': API_TOKEN },
        responseType: 'arraybuffer',
      }
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="label-${reference_number}.pdf"`,
    });

    return res.send(response.data);
  } catch (error) {
    console.error('❌ Label Generation Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error generating label', error: error.response?.data || error.message });
  }
};

// 🔍 Track Shipment
const authenticateDTDC = async () => {
  const authUrl = `http://dtdcstagingapi.dtdc.com/dtdc-tracking-api/dtdc-api/api/dtdc/authenticate?username=${TRACK_USERNAME}&password=${TRACK_PASSWORD}`;
  const response = await axios.get(authUrl);
  return response.data.token; // Assuming it returns { token: '...' }
};

const trackShipment = async (req, res) => {
  try {
    const { awbNumber } = req.body;

    if (!awbNumber) {
      return res.status(400).json({ message: 'AWB number is required' });
    }

    // 1. Authenticate
    const token = await authenticateDTDC();

    // 2. Track
    const trackingUrl = `http://dtdcstagingapi.dtdc.com/dtdc-tracking-api/dtdc-api/api/dtdc/track`;

    const payload = {
      crtn: [
        {
          reference_number: awbNumber,
        },
      ],
    };

    const trackingResponse = await axios.post(trackingUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return res.json({
      message: 'Tracking successful',
      trackingData: trackingResponse.data,
    });

  } catch (error) {
    console.error('❌ DTDC Tracking Error:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Error tracking consignment',
      error: error.response?.data || error.message,
    });
  }
};

// ❌ Cancel Consignment
const cancelConsignment = async (req, res) => {
  try {
    const { awb_number } = req.body;

    if (!awb_number) {
      return res.status(400).json({ message: 'AWB number is required' });
    }

    const cancelPayload = {
      AWBNo: [awb_number],
      customer_code: 'GL017',
    };

    const response = await axios.post(
      'https://alphademodashboardapi.shipsy.io/api/customer/integration/consignment/cancel',
      cancelPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'API-KEY': API_TOKEN,
          'X-Access-Token': Access_Token,
        },
      }
    );

    return res.status(200).json({
      message: 'Consignment cancelled successfully',
      dtdcResponse: response.data,
    });
  } catch (error) {
    console.error('❌ Cancel Consignment Error:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Error cancelling consignment',
      error: error.response?.data || error.message,
    });
  }
};


const PINCODE_API_URL = "http://smarttrack.ctbsplus.dtdc.com/ratecalapi/PincodeApiCall";

const validatePincodes = async (req, res) => {
  const { orgPincode, desPincode } = req.body;

  if (!orgPincode || !desPincode) {
    return res.status(400).json({ status: false, message: "Both origin and destination pincodes are required" });
  }

  try {
    // console.log("🔍 Validating Pincodes:", { orgPincode, desPincode });

    const response = await axios.post(PINCODE_API_URL, {
      orgPincode,
      desPincode,
    });

 const result = response.data;
// console.log("📦 DTDC Pincode Response:", result);

const isSuccess =
  result?.ZIPCODE_RESP?.[0]?.MESSAGE === "SUCCESS" &&
  result?.SERV_LIST?.[0]?.b2C_SERVICEABLE === "YES";

if (isSuccess) {
  return res.status(200).json({ valid: true, data: result });
} else {
  return res.status(400).json({
    valid: false,
    message:
      result?.ZIPCODE_RESP?.[0]?.MESSAGE !== "SUCCESS"
        ? "Invalid Pincode"
        : "Service not available for the selected route",
  });
}

  } catch (err) {
    console.error("❌ Pincode Validation Error:", err.message);
    return res.status(500).json({ valid: false, error: "Failed to validate pincodes" });
  }
};


const getAllCourierOrder = async (req, res) => {
  try {
    let data = await CourierOrderModal.find({}).sort({ _id: -1 });
    res.send(data);
  } catch (err) {
    res.status(400).send(err);
  }
}
const getAllCourierOrderById = async (req, res) => {
  try {
    const { brandId, serviceCenterId } = req.query;

    let query = {};
    if (brandId) {
      query.brandId = brandId;
    }
    if (serviceCenterId) {
      query.serviceCenterId = serviceCenterId;
    }


    let data = await CourierOrderModal.find(query).sort({ _id: -1 });



    res.send(data);
  } catch (err) {
    console.error('Error in getAllOrderById:', err);
    res.status(400).send(err);
  }
};


const getCourierOrderById = async (req, res) => {
  try {
    let _id = req.params.id;
    let data = await CourierOrderModal.findById(_id);
    res.send(data);
  } catch (err) {
    res.status(400).send(err);
  }
}

const editCourierOrder = async (req, res) => {
  try {
    let _id = req.params.id;
    let body = req.body;
    let data = await CourierOrderModal.findByIdAndUpdate(_id, body);
    res.json({ status: true, msg: "Order Updated" });
  } catch (err) {
    res.status(500).send(err);
  }
}


module.exports = { createConsignmentDTDC, validatePincodes,generateLabel, trackShipment, cancelConsignment ,getAllCourierOrder,getCourierOrderById,getAllCourierOrderById,editCourierOrder};
