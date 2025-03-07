const axios = require('axios');
const OrderModel = require("../models/order")
const BrandStockModel = require("../models/brandStock")
const UserStockModel = require("../models/userStock")
// {
//   "success": true,
//   "data": [
//       {
//           "name": "Lalit  Chauhan",
//           "email": "lybley@gmail.com",
//           "sellerId": 132125,
//           "companyId": "00a8dd6f-9a70-497e-b7bd-2c149521fdad",
//           "privateCompanyId": 130776,
//           "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imx5YmxleUBnbWFpbC5jb20iLCJzZWxsZXJJZCI6MTMyMTI1LCJjb21wYW55SWQiOiIwMGE4ZGQ2Zi05YTcwLTQ5N2UtYjdiZC0yYzE0OTUyMWZkYWQiLCJwcml2YXRlQ29tcGFueUlkIjoxMzA3NzYsImlhdCI6MTcyMjY2NTk5MCwiZXhwIjoxNzIzMjcwNzkwfQ.xkZp9QlQO_vYF0JYNYvCVkN2rhw2hDvZ9JEpGTQlCTA",
//           "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imx5YmxleUBnbWFpbC5jb20iLCJzZWxsZXJJZCI6MTMyMTI1LCJjb21wYW55SWQiOiIwMGE4ZGQ2Zi05YTcwLTQ5N2UtYjdiZC0yYzE0OTUyMWZkYWQiLCJwcml2YXRlQ29tcGFueUlkIjoxMzA3NzYsImlhdCI6MTcyMjY2NTk5MCwiZXhwIjoxNzIzMjcwNzkwfQ.xkZp9QlQO_vYF0JYNYvCVkN2rhw2hDvZ9JEpGTQlCTA",
//           "nextStep": {
//               "qna": true,
//               "kyc": true,
//               "bank": false,
//               "isChannelIntegrated": false
//           },
//           "contactNumber": 9953889657,
//           "isWalletRechage": true,
//           "isReturningUser": false,
//           "isMigrated": false,
//           "phpUserId": "",
//           "phpParentId": "",
//           "businessType": "COMPANY",
//           "kycDetails": {
//               "gstNumber": "09AAECL0443M1ZD",
//               "gstVerified": true,
//               "gstFile": "",
//               "panNumber": "AAECL0443M",
//               "panVerified": true,
//               "panFile": "",
//               "aadharNumber": 0,
//               "aadharVerified": false,
//               "aadharFile": "",
//               "address": {
//                   "plotNumber": "A-9, ",
//                   "locality": "sector-59, noida",
//                   "city": "GHAZIABAD",
//                   "district": "GHAZIABAD",
//                   "pincode": 201309,
//                   "state": "UTTAR PRADESH",
//                   "country": "INDIA"
//               },
//               "fullAddress": "A-9, sector-59, noida Noida Sec-62 201309 GHAZIABAD UTTAR PRADESH INDIA",
//               "isKYCDone": true,
//               "fullName": "LYBLEY INDIA PRIVATE LIMITED"
//           },
//           "isMaskedUser": false,
//           "isWalletBlackListed": false
//       }
//   ],
//   "message": "Seller Signed In Successfully."
// }
const SHIPYARI_API_BASE_URL = 'https://api-seller.shipyaari.com/api/v1'; // Replace with the actual base URL
const SHIPYARI_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imx5YmxleUBnbWFpbC5jb20iLCJzZWxsZXJJZCI6MTMyMTI1LCJjb21wYW55SWQiOiIwMGE4ZGQ2Zi05YTcwLTQ5N2UtYjdiZC0yYzE0OTUyMWZkYWQiLCJwcml2YXRlQ29tcGFueUlkIjoxMzA3NzYsImlhdCI6MTczNDQyMTMxMSwiZXhwIjoxNzM1MDI2MTExfQ.AyC6rL4E-KJD9xw6tWDfjSMdLOyKGQvqI08CZGrPg1c'; // Replace with your Shipyari API key

const shipyariInstance = axios.create({
  baseURL: SHIPYARI_API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${SHIPYARI_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

// Example function to get shipping rates
const getShippingRates = async (data) => {
  try {
    const response = await shipyariInstance.post('/order/placeOrderApiV3', data);
    return response.data;
  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    throw error;
  }
};

// Example function to create a shipment
// const createShipment = async (req, res) => {
//   const data = req.body;

//   const pickupPincode = data?.pickupDetails?.pincode;
//   const deliveryPincode = data?.deliveryDetails?.pincode;
//   const firstBox = data?.boxInfo?.[0] || {};  

//   const weight = firstBox?.deadWeight;  
//   const dimension = {
//     length: firstBox?.length,
//     width: firstBox?.breadth,
//     height: firstBox?.height
//   };

//   const orderType = "B2C";
//   const paymentMode = "PREPAID";
//   const invoiceValue = 10;


//   try {

//     if (!pickupPincode || !deliveryPincode || !invoiceValue || !paymentMode || !weight || !orderType || !dimension) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }


//     const responseAbility = await shipyariInstance.post(
//       'order/checkServiceabilityV2',
//       {
//         pickupPincode,
//         deliveryPincode,
//         invoiceValue,
//         paymentMode,
//         weight,
//         orderType,
//         dimension
//       }
//     );


//     if (responseAbility.data.success) {

//       const response = await shipyariInstance.post('/order/placeOrderApiV3', req.body);

//       res.status(response.status).json(msg?.response.data.message);
//     } else {

//       return res.status(400).json({ message: 'Serviceability check failed' });
//     }

//   } catch (error) {

//     console.error('Error creating shipment:', error);
//     return res.status(500).json({ msg: error?.response?.data?.message });
//   }
// };

const createShipment = async (req, res) => {
  const data = req.body;

  const pickupPincode = Number(data?.brandPincode);
  const deliveryPincode = Number(data?.supplierInformation?.pinCode);
  const weight = Number(data?.weight); // Ensure weight is a number
  const dimension = {
    length: Number(data?.length),  // Ensure dimensions are numbers
    width: Number(data?.breadth),
    height: Number(data?.height)
  };

  const orderType = "B2C";
  const paymentMode = "PREPAID";
  const invoiceValue = 10;

  const orderData = {
    pickupDetails: {
      fullAddress: data?.brandAddress,
      pincode: pickupPincode,
      contact: {
        name: data?.brand,
        mobileNo: Number(data?.brandContact)
      }
    },
    deliveryDetails: {
      fullAddress: data?.supplierInformation?.address,
      pincode: deliveryPincode,
      contact: {
        name: data?.serviceCenter,
        mobileNo: Number(data?.supplierInformation?.contact)
      },
      gstNumber: ''
    },
    boxInfo: [
      {
        name: 'box_1',
        weightUnit: 'Kg',
        deadWeight: weight,
        length: dimension.length,
        breadth: dimension.width,
        height: dimension.height,
        measureUnit: 'cm',
        products: [
          {
            name: data?.partName,
            category: 'Electronic',
            sku: 'abc',
            qty: Number(data?.quantity),
            unitPrice: Number(data?.bestPrice),
            unitTax: 180,
            weightUnit: 'kg',
            deadWeight: weight,
            length: dimension.length,
            breadth: dimension.width,
            height: dimension.height,
            measureUnit: 'cm'
          }
        ],
        codInfo: {
          isCod: false,
          collectableAmount: 0,
          invoiceValue: 2000
        },
        podInfo: {
          isPod: false
        },
        insurance: false
      }
    ],
    orderType,
    transit: 'FORWARD',
    courierPartner: '',
    source: '',
    pickupDate: '1711606459000',  // Ensure this is in the correct format expected by the API
    gstNumber: '',
    orderId: '',
    eWayBillNo: '',
    brandName: 'Google',
    brandLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/250px-Google_2015_logo.svg.png'
  }

  try {
    // Validate required fields
    if (!pickupPincode || !deliveryPincode || !invoiceValue || !paymentMode || !weight || !orderType || !dimension) {
      return res.status(400).json({ status: false, msg: 'All fields are required for shipment' });
    }

    // Check serviceability
    const responseAbility = await shipyariInstance.post('order/checkServiceabilityV2', {
      pickupPincode,
      deliveryPincode,
      invoiceValue,
      paymentMode,
      weight,
      orderType,
      dimension
    });

    if (!responseAbility.data.success) {
      return res.status(400).json({ status: false, msg: 'Serviceability check failed' });
    }
    let { quantity, sparepartId, serviceCenterId, serviceCenter } = data;

    const sparePart = await BrandStockModel.findOne({ sparepartId: sparepartId }).exec();  // Ensure exec() for query execution

    if (!sparePart) {
      return res.status(404).json({ status: false, msg: "Spare part not found" });
    }

    // Check if there is enough stock to fulfill the order
    if (parseInt(sparePart.freshStock) < quantity) {
      return res.json({ status: false, msg: "Insufficient stock" });
    }
    // Place the order
    const response = await shipyariInstance.post('/order/placeOrderApiV3', orderData);
    // console.log(response);

    // Check if the placement of the order was successful
    if (response.data.success) {
      // Retrieve the spare part to check the stock quantity
   

      // Deduct the order quantity from the stock
      sparePart.freshStock = parseInt(sparePart.freshStock) - quantity;
      await sparePart.save();

      // Update the service center stock if serviceCenterId is provided
      if (serviceCenterId) {
        const serviceCenterStock = await UserStockModel.findOne({ serviceCenterId: serviceCenterId, sparepartId: sparepartId }).exec();  // Ensure exec() for query execution

        if (serviceCenterStock) {
          serviceCenterStock.freshStock = parseInt(serviceCenterStock.freshStock) + quantity;
          await serviceCenterStock.save();
        } else {
          await UserStockModel.create({
            serviceCenterId: serviceCenterId,
            serviceCenterName: serviceCenter,
            sparepartId: sparepartId,
            sparepartName: sparePart.name,
            freshStock: quantity,
          });
        }
      }
      let backendOrder = { ...data, shipyariOrder: response?.data }
      // Create a new order
      let newOrder = new OrderModel(backendOrder);
      await newOrder.save();

      // Send response with the shipment and order status
      res.status(response.status).json({
        message: response.data.message,
        orderStatus: { status: true, msg: "Order Added" }
      });
    } else {
      return res.status(400).json({ message: 'Order placement failed' });
    }
  } catch (error) {
    console.error('Error in createShipment:', error);
    res.status(500).json({ status: false, msg: error?.response?.data?.message || 'Internal Server Error' });
  }
};
const createServiceShipment = async (req, res) => {
  const data = req.body;

  const pickupPincode = Number(data?.supplierInformation?.pinCode)
  const deliveryPincode = Number(data?.serviceCenterPincode);
  const weight = Number(data?.weight); // Ensure weight is a number
  const dimension = {
    length: Number(data?.length),  // Ensure dimensions are numbers
    width: Number(data?.breadth),
    height: Number(data?.height)
  };

  const orderType = "B2C";
  const paymentMode = "PREPAID";
  const invoiceValue = 10;

  const orderData = {
    pickupDetails: {
      fullAddress: data?.supplierInformation?.address,
      pincode: pickupPincode,
      contact: {
        name: data?.brand,
        mobileNo: Number(data?.supplierInformation?.contact)
      }
    },
    deliveryDetails: {
      fullAddress: data?.serviceCenterAddress,
      pincode: deliveryPincode,
      contact: {
        name: data?.serviceCenter,
        mobileNo: Number(data?.serviceContact)
      },
      gstNumber: ''
    },
    boxInfo: [
      {
        name: 'box_1',
        weightUnit: 'Kg',
        deadWeight: weight,
        length: dimension.length,
        breadth: dimension.width,
        height: dimension.height,
        measureUnit: 'cm',
        products: [
          {
            name: data?.partName,
            category: 'Electronic',
            sku: 'abc',
            qty: Number(data?.quantity),
            unitPrice: Number(data?.bestPrice),
            unitTax: 180,
            weightUnit: 'kg',
            deadWeight: weight,
            length: dimension.length,
            breadth: dimension.width,
            height: dimension.height,
            measureUnit: 'cm'
          }
        ],
        codInfo: {
          isCod: false,
          collectableAmount: 0,
          invoiceValue: 2000
        },
        podInfo: {
          isPod: false
        },
        insurance: false
      }
    ],
    orderType,
    transit: 'FORWARD',
    courierPartner: '',
    source: '',
    pickupDate: '1711606459000',  // Ensure this is in the correct format expected by the API
    gstNumber: '',
    orderId: '',
    eWayBillNo: '',
    brandName: 'Google',
    brandLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/250px-Google_2015_logo.svg.png'
  }

  try {
    // Validate required fields
    if (!pickupPincode || !deliveryPincode || !invoiceValue || !paymentMode || !weight || !orderType || !dimension) {
      return res.status(400).json({ status: false, msg: 'All fields are required for shipment' });
    }

    // Check serviceability
    const responseAbility = await shipyariInstance.post('order/checkServiceabilityV2', {
      pickupPincode,
      deliveryPincode,
      invoiceValue,
      paymentMode,
      weight,
      orderType,
      dimension
    });

    if (!responseAbility.data.success) {
      return res.status(400).json({ status: false, msg: 'Serviceability check failed' });
    }
    let { quantity, sparepartId, serviceCenterId, serviceCenter } = data;

    const sparePart = await BrandStockModel.findOne({ sparepartId: sparepartId }).exec();  // Ensure exec() for query execution

    if (!sparePart) {
      return res.status(404).json({ status: false, msg: "Spare part not found" });
    }

    // Check if there is enough stock to fulfill the order
    if (parseInt(sparePart.freshStock) < quantity) {
      return res.json({ status: false, msg: "Insufficient stock" });
    }
    // Place the order
    const response = await shipyariInstance.post('/order/placeOrderApiV3', orderData);
    // console.log(response);

    // Check if the placement of the order was successful
    if (response.data.success) {
      // Retrieve the spare part to check the stock quantity
   

      // Deduct the order quantity from the stock
      sparePart.freshStock = parseInt(sparePart.freshStock) - quantity;
      await sparePart.save();

      // Update the service center stock if serviceCenterId is provided
      if (serviceCenterId) {
        const serviceCenterStock = await UserStockModel.findOne({ serviceCenterId: serviceCenterId, sparepartId: sparepartId }).exec();  // Ensure exec() for query execution

        if (serviceCenterStock) {
          serviceCenterStock.freshStock = parseInt(serviceCenterStock.freshStock) + quantity;
          await serviceCenterStock.save();
        } else {
          await UserStockModel.create({
            serviceCenterId: serviceCenterId,
            serviceCenterName: serviceCenter,
            sparepartId: sparepartId,
            sparepartName: sparePart.name,
            freshStock: quantity,
          });
        }
      }
      let backendOrder = { ...data, shipyariOrder: response?.data }
      // Create a new order
      let newOrder = new OrderModel(backendOrder);
      await newOrder.save();

      // Send response with the shipment and order status
      res.status(response.status).json({
        message: response.data.message,
        orderStatus: { status: true, msg: "Order Added" }
      });
    } else {
      return res.status(400).json({ message: 'Order placement failed' });
    }
  } catch (error) {
    console.error('Error in createShipment:', error);
    res.status(500).json({ status: false, msg: error?.response?.data?.message || 'Internal Server Error' });
  }
};
const createDefectiveShipment = async (req, res) => {
  const data = req.body;

  const pickupPincode = Number(data?.serviceCenterPincode);
  const deliveryPincode = Number(data?.supplierInformation?.pinCode);
  const weight = Number(data?.weight); // Ensure weight is a number
  const dimension = {
    length: Number(data?.length),  // Ensure dimensions are numbers
    width: Number(data?.breadth),
    height: Number(data?.height)
  };

  const orderType = "B2C";
  const paymentMode = "PREPAID";
  const invoiceValue = 10;

  const orderData = {
    pickupDetails: {
      fullAddress: data?.serviceCenterAddress,
      pincode: pickupPincode,
      contact: {
        name: data?.serviceCenter,
        mobileNo: Number(data?.serviceContact)
      }
    },
    deliveryDetails: {
      fullAddress: data?.supplierInformation?.address,
      pincode: deliveryPincode,
      contact: {
        name: data?.serviceCenter,
        mobileNo: Number(data?.supplierInformation?.contact)
      },
      gstNumber: ''
    },
    boxInfo: [
      {
        name: 'box_1',
        weightUnit: 'Kg',
        deadWeight: weight,
        length: dimension.length,
        breadth: dimension.width,
        height: dimension.height,
        measureUnit: 'cm',
        products: [
          {
            name: data?.partName,
            category: 'Electronic',
            sku: 'abc',
            qty: Number(data?.quantity),
            unitPrice: Number(data?.bestPrice),
            unitTax: 180,
            weightUnit: 'kg',
            deadWeight: weight,
            length: dimension.length,
            breadth: dimension.width,
            height: dimension.height,
            measureUnit: 'cm'
          }
        ],
        codInfo: {
          isCod: false,
          collectableAmount: 0,
          invoiceValue: 2000
        },
        podInfo: {
          isPod: false
        },
        insurance: false
      }
    ],
    orderType,
    transit: 'FORWARD',
    courierPartner: '',
    source: '',
    pickupDate: '1711606459000',  // Ensure this is in the correct format expected by the API
    gstNumber: '',
    orderId: '',
    eWayBillNo: '',
    brandName: 'Google',
    brandLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/250px-Google_2015_logo.svg.png'
  }

  try {
    // Validate required fields
    if (!pickupPincode || !deliveryPincode || !invoiceValue || !paymentMode || !weight || !orderType || !dimension) {
      return res.status(400).json({ status: false, msg: 'All fields are required for shipment' });
    }

    // Check serviceability
    const responseAbility = await shipyariInstance.post('order/checkServiceabilityV2', {
      pickupPincode,
      deliveryPincode,
      invoiceValue,
      paymentMode,
      weight,
      orderType,
      dimension
    });

    if (!responseAbility.data.success) {
      return res.status(400).json({ status: false, msg: 'Serviceability check failed' });
    }
    let { quantity, sparepartId, serviceCenterId, serviceCenter } = data;

    const sparePart = await BrandStockModel.findOne({ sparepartId: sparepartId }).exec();  // Ensure exec() for query execution

    if (!sparePart) {
      return res.status(404).json({ status: false, msg: "Spare part not found" });
    }

    // Check if there is enough stock to fulfill the order
    // if (parseInt(sparePart.defec) < quantity) {
    //   return res.json({ status: false, msg: "Insufficient stock" });
    // }
    // Place the order
    const response = await shipyariInstance.post('/order/placeOrderApiV3', orderData);
    // console.log(response);

    // Check if the placement of the order was successful
    if (response.data.success) {
      // Retrieve the spare part to check the stock quantity
   

      // Deduct the order quantity from the stock
      sparePart.defectiveStock = parseInt(sparePart.defectiveStock) + quantity;
      await sparePart.save();

      // Update the service center stock if serviceCenterId is provided
      if (serviceCenterId) {
        const serviceCenterStock = await UserStockModel.findOne({ serviceCenterId: serviceCenterId, sparepartId: sparepartId }).exec();  // Ensure exec() for query execution

        if (serviceCenterStock) {
          serviceCenterStock.defectiveStock = parseInt(serviceCenterStock.defectiveStock) + quantity;
          await serviceCenterStock.save();
        } else {
          await UserStockModel.create({
            serviceCenterId: serviceCenterId,
            serviceCenterName: serviceCenter,
            sparepartId: sparepartId,
            sparepartName: sparePart.name,
            defectiveStock: quantity,
          });
        }
      }
      let backendOrder = { ...data, shipyariOrder: response?.data }
      // Create a new order
      let newOrder = new OrderModel(backendOrder);
      await newOrder.save();

      // Send response with the shipment and order status
      res.status(response.status).json({
        message: response.data.message,
        orderStatus: { status: true, msg: "Order Added" }
      });
    } else {
      return res.status(400).json({ message: 'Order placement failed' });
    }
  } catch (error) {
    console.error('Error in createShipment:', error);
    res.status(500).json({ status: false, msg: error?.response?.data?.message || 'Internal Server Error' });
  }
};


const fetchManifest = async (req, res) => {
  const { awbs } = req.body;

  try {
    const response = await shipyariInstance.post(
      'order/fetchManifest',
      { awbs  }

    );

    // Forward the response from Shipyaari API to the client
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error fetching manifest:', error);
    res.status(error.response ? error.response.status : 500).json({
      message: 'An error occurred while fetching the manifest',
      error: error.response ? error.response.data : error.message
    });
  }
};
const fetchLabels = async (req, res) => {
  const { awbs } = req.body;

  try {
    const response = await shipyariInstance.post(
      'labels/fetchLabels',
      { awbs }
    );

    // Forward the response from Shipyaari API to the client
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error fetching labels:', error);
    res.status(error.response ? error.response.status : 500).json({
      message: 'An error occurred while fetching the labels',
      error: error.response ? error.response.data : error.message
    });
  }
};

// const fetchLabels = async (req, res) => {
//   const { avnkey, shipyaari_id } = req.body; // Destructure request body

//   try {
//     // Send POST request to Shipyaari API
//     const response = await shipyariInstance.post(
//       "labels/getlabel_avn",
//       {
//         avnkey,          // AVN key from client
//         shipyaari_id,    // Array of Shipyaari IDs
//       }
//     );

//     // Forward the response to the client
//     res.status(response.status).json(response.data);
//   } catch (error) {
//     console.error("Error fetching labels:", error);

//     // Handle errors
//     res.status(error.response ? error.response.status : 500).json({
//       message: "An error occurred while fetching the labels",
//       error: error.response ? error.response.data : error.message,
//     });
//   }
// };




const fetchTaxInvoices = async (req, res) => {
  const { awbs } = req.body;

  try {
    const response = await shipyariInstance.post(
      'labels/fetchTaxInvoices',
      { awbs }
    );

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error fetching tax invoices:', error);
    res.status(error.response ? error.response.status : 500).json({
      message: 'An error occurred while fetching the tax invoices',
      error: error.response ? error.response.data : error.message
    });
  }
};
const cancelShipment = async (req, res) => {
  const { awbs } = req.body;

  try {
    const response = await shipyariInstance.post(
      'order/cancelAWBs',
      { awbs }
    );

    res.status(response.status).json(response.data);
  } catch (error) {
    // Log the error for debugging
    console.error('Error canceling AWBs:', error.response ? error.response.data : error.message);

    // Determine the status code and error message to return
    const statusCode = error.response ? error.response.status : 500;
    const errorMessage = error.response ? error.response.data.message || 'An error occurred while canceling AWBs' : 'An unexpected error occurred';

    // Send the error response to the client
    res.status(statusCode).json({
      message: errorMessage,
      error: error.response ? error.response.data : error.message
    });
  }
};

const trackingShipment = async (req, res) => {
  const { trackingNo } = req.params;

  if (!trackingNo) {
    return res.status(400).json({ msg: 'Tracking number is required' });
  }

  try {
    const response = await shipyariInstance.post(
      `tracking/getTracking?trackingNo=${trackingNo}`,

    );

    res.status(response.status).json(response.data);
  } catch (error) {
    // Log the error for debugging
    console.error('Error fetching tracking information:', error.response ? error.response.data : error.message);

    // Determine the status code and error message to return
    const statusCode = error.response ? error.response.status : 500;
    const errorMessage = error.response ? error.response.data.message || 'An error occurred while fetching tracking information' : 'An unexpected error occurred';

    // Send the error response to the client
    res.status(statusCode).json({
      message: errorMessage,
      error: error.response ? error.response.data : error.message
    });
  }
};

const searchAvailability = async (req, res) => {
  const {
    pickupPincode,
    deliveryPincode,
    invoiceValue,
    paymentMode,
    weight,
    orderType,
    dimension
  } = req.body;

  if (!pickupPincode || !deliveryPincode || !invoiceValue || !paymentMode || !weight || !orderType || !dimension) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  // console.log("req.body",req.body)
  try {
    const response = await shipyariInstance.post(
      `order/checkServiceabilityV2`,
      {
        pickupPincode,
        deliveryPincode,
        invoiceValue,
        paymentMode,
        weight,
        orderType,
        dimension
      },
    );

    res.status(response.status).json(response.data);
  } catch (error) {
    // Log the error for debugging
    console.error('Error checking serviceability:', error.response ? error.response.data : error.message);

    // Determine the status code and error message to return
    const statusCode = error.response ? error.response.status : 500;
    const errorMessage = error.response ? error.response.data.message || 'An error occurred while checking serviceability' : 'An unexpected error occurred';

    // Send the error response to the client
    res.status(statusCode).json({
      message: errorMessage,
      error: error.response ? error.response.data : error.message
    });
  }
};
module.exports = {
  getShippingRates,
  createShipment,
  createServiceShipment,
  createDefectiveShipment,
  fetchLabels,
  fetchManifest,
  fetchTaxInvoices,
  cancelShipment, trackingShipment, searchAvailability

};
