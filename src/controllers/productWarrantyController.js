const ProductWarrantyModal = require("../models/productWarranty")
const { UserModel } = require('../models/registration');
const QRCode = require('qrcode');
const mongoose = require('mongoose');





// Helper function to generate a unique record with retry logic

// const addProductWarranty = async (req, res) => {
//   try {
//     const {
//       productName = '',
//       productId = '',
//       categoryId = '',
//       categoryName = '',
//       year = new Date().getFullYear(),
//       numberOfGenerate,
//       batchNo,
//       warrantyInDays,
//       brandName,
//       brandId
//     } = req.body;

//     if (!brandName || !brandId || !numberOfGenerate || !warrantyInDays) {
//       return res.status(400).json({ status: false, msg: 'Missing required fields' });
//     }

//     const numberOfRecords = Number(numberOfGenerate);
//     if (isNaN(numberOfRecords) || numberOfRecords <= 0) {
//       return res.status(400).json({ status: false, msg: 'Invalid numberOfGenerate' });
//     }

//     console.log("numberOfRecords", numberOfRecords);
//     console.log("req.body", req.body);

//     const promises = [];
//     for (let i = 0; i < numberOfRecords; i++) {
//       promises.push(generateUniqueRecord(i, req.body));
//     }

//     const generatedRecords = await Promise.all(promises);
//     console.log("generatedRecords", generatedRecords);

//     if (generatedRecords.length === 0) {
//       return res.status(500).json({ status: false, msg: 'No records were created due to errors' });
//     }

//     const metadata = new ProductWarrantyModal({
//       brandName,
//       brandId,
//       productName,
//       numberOfGenerate,
//       warrantyInDays,
//       year,
//       id: new mongoose.Types.ObjectId(),
//       records: generatedRecords,
//     });

//     const savedMetadata = await metadata.save();
//     console.log("savedMetadata", savedMetadata);

//     res.status(201).json({
//       status: true,
//       msg: 'Warranty Created',
//       data: {
//         brandName,
//         brandId,
//         productName,
//         numberOfGenerate,
//         warrantyInDays,
//         year,
//         id: savedMetadata.id,
//         records: savedMetadata.records,
//       },
//     });
//   } catch (error) {
//     console.error("Error in addProductWarranty:", error);
//     if (error.code === 11000) {
//       return res.status(409).json({ status: false, msg: 'Duplicate uniqueId found' });
//     }
//     res.status(500).json({ status: false, msg: error.message });
//   }
// };

const addProductWarranty = async (req, res) => {
  try {
    const {
      productName = '',
      productId = '',
      categoryId = '',
      categoryName = '',
      year = new Date().getFullYear(),
      numberOfGenerate,
      batchNo,
      warrantyInDays,
      brandName,
      brandId
    } = req.body;

    // ✅ Validate required fields
    if (!brandName || !brandId || !numberOfGenerate || !warrantyInDays) {
      return res.status(400).json({ status: false, msg: 'Missing required fields' });
    }

    // ✅ Ensure numberOfGenerate is a valid positive integer
    const numberOfRecords = parseInt(numberOfGenerate, 10);
    if (isNaN(numberOfRecords) || numberOfRecords <= 0) {
      return res.status(400).json({ status: false, msg: 'Invalid numberOfGenerate' });
    }

    console.log(`🔹 Total records to generate: ${numberOfRecords}`);

    const batchSize = 100; // ✅ Adjust batch size as needed
    let generatedRecords = [];
    let failedRecords = 0;

    for (let i = 0; i < numberOfRecords; i += batchSize) {
      const batchPromises = [];

      for (let j = 0; j < Math.min(batchSize, numberOfRecords - i); j++) {
        batchPromises.push(generateUniqueRecord(i + j, req.body));
      }

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          generatedRecords.push(result.value);
        } else {
          console.error(`⚠️ Failed record #${i + index + 1}:`, result.reason);
          failedRecords++;
        }
      });

      console.log(`✅ Processed batch ${i / batchSize + 1}, total records so far: ${generatedRecords.length}`);

      // ✅ Small delay to prevent MongoDB from being overwhelmed
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (generatedRecords.length === 0) {
      return res.status(500).json({ status: false, msg: 'No records were created due to errors' });
    }

    // ✅ Save all records at once using insertMany() for better performance
    try {
      const savedMetadata = await ProductWarrantyModal.create({
        brandName,
        brandId,
        productName,
        numberOfGenerate,
        warrantyInDays,
        year,
        id: new mongoose.Types.ObjectId(),
        records: generatedRecords,
      });

      console.log(`✅ Warranty Created Successfully: ${generatedRecords.length} records saved`);

      res.status(201).json({
        status: true,
        msg: `Warranty Created Successfully with ${generatedRecords.length} records`,
        failedRecords,
        data: savedMetadata,
      });
    } catch (dbError) {
      console.error("❌ MongoDB Insert Error:", dbError);
      return res.status(500).json({ status: false, msg: 'Error saving records to database', error: dbError.message });
    }

  } catch (error) {
    console.error("❌ Error in addProductWarranty:", error);

    if (error.code === 11000) {
      return res.status(409).json({ status: false, msg: 'Duplicate uniqueId found' });
    }

    res.status(500).json({ status: false, msg: 'Internal Server Error', error: error.message });
  }
};



const generateUniqueRecord = async (index, data) => {
  let uniqueId;
  let qrCodeUrl;

  // Retry logic to handle duplicate key errors
  for (let retry = 0; retry < 5; retry++) {
    try {
      uniqueId = await generateUniqueId();

      // Check once more before using this uniqueId if it already exists in the database
      const existingRecord = await ProductWarrantyModal.findOne({ 'records.uniqueId': uniqueId });
      if (existingRecord) {
        console.log(`Duplicate uniqueId detected: ${uniqueId}, retrying...`);
        continue; // Retry if this uniqueId already exists
      }

      const qrCodeUrl1 = `https://crm.servsy.in/warrantyActivation?uniqueId=${uniqueId}`;
      qrCodeUrl = await QRCode.toDataURL(qrCodeUrl1);
      break; // Exit loop if successful
    } catch (error) {
      if (error.code === 11000 && retry < 4) {
        console.log(`Duplicate uniqueId during insert: ${uniqueId}, retrying...`);
        continue;
      }
      throw error; // Rethrow error if it's not a duplicate key error or retries exceeded
    }
  }

  return {
    productName: data.productName,
    productId: data.productId,
    categoryId: data.categoryId,
    brandId: data.brandId,
    brandName: data.brandName,
    categoryName: data.categoryName,
    uniqueId,
    year: data.year,
    batchNo: data.batchNo,
    warrantyInDays: data.warrantyInDays,
    qrCodes: [{ qrCodeUrl, index: index + 1 }],
  };
};

// Generates a uniqueId and checks database for uniqueness
const generateUniqueId = async () => {
  let uniqueId;
  let isUnique = false;

  while (!isUnique) {
    // uniqueId = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit number
    uniqueId = Math.floor(1000000 + Math.random() * 9000000).toString(); // ✅ 7-digit unique ID

    // Check if this uniqueId already exists in the database
    const existingRecord = await ProductWarrantyModal.findOne({ 'records.uniqueId': uniqueId });
    if (!existingRecord) {
      isUnique = true;
    }
  }

  return uniqueId;
};






const activateWarranty = async (req, res) => {
  try {
    const { name, contact, email, address, lat, long, pincode, district, state, password, uniqueId, } = req.body;
    const productId = req.body.productId
    // console.log("");

    // if (!name || !contact || !address || !uniqueId) {
    //   return res.status(400).json({ status: false, msg: 'Missing required fields' });
    // }

    // Check if the user already exists
    let user = await UserModel.findOne({ contact });
    if (!user) {
      // Hash the password and create a new user

      user = new UserModel({

        name,
        contact,
        email,
        address,
        password,
        lat, long, pincode
      });
      await user.save();
    }

    // Find the warranty record based on the unique ID
    const warranty = await ProductWarrantyModal.findOne({ 'records.uniqueId': uniqueId });
    if (!warranty) {
      return res.status(404).json({ status: false, msg: 'Warranty not found' });
    }

    // Find the specific record with the matching uniqueId
    const record = warranty.records.find(record => record.uniqueId === uniqueId);
    if (!record) {
      return res.status(404).json({ status: false, msg: 'Warranty record not found' });
    }

    // Check if the warranty has already been activated
    if (record.isActivated) {
      return res.status(400).json({ status: false, msg: 'This warranty has already been activated' });
    }
    lat, long, pincode,
      // Activate the warranty
      record.isActivated = true;
    record.userName = user.name;
    record.userId = user._id;
    record.email = email;
    record.contact = contact;
    record.address = address;
    record.lat = lat;
    record.long = long;
    record.district = district;
    record.state = state;
    record.pincode = pincode;
    record.termsCondtions = req.body.termsCondtions;

    record.activationDate = new Date();
    if (productId) {
      record.productName = req.body.productName;
      record.productId = productId;
      record.categoryName = req.body.categoryName;
      record.categoryId = req.body.categoryId;
      record.year = req.body.year;
    }
    // Save the updated warranty
    await warranty.save();

    res.status(200).json({
      status: true,
      msg: 'Warranty activated successfully',
      data: record, // Return only the activated record
    });
  } catch (error) {
    res.status(500).json({ status: false, msg: error.message });
  }



};




const getAllProductWarranty = async (req, res) => {
  try {
    let data = await ProductWarrantyModal.find({}).sort({ _id: -1 });
    res.send(data);
  } catch (err) {
    res.status(400).send(err);
  }
}
// const getAllProductWarrantyWithPage = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     // Get the total count of documents
//     const totalRecords = await ProductWarrantyModal.countDocuments();

//     // Fetch the data with pagination
//     let data = await ProductWarrantyModal.find({})
//       .sort({ _id: -1 })
//       .skip(skip)
//       .limit(limit);

//     // Send response with data and total count
//     res.send({ data, totalRecords });
//   } catch (err) {
//     res.status(400).send(err);
//   }
// };

//21032025
const getAllProductWarrantyWithPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;  // Default page 1
    const limit = parseInt(req.query.limit) || 10; // Default limit 50

    if (page < 1 || limit < 1) {
      return res.status(400).json({ status: false, msg: "Invalid page or limit" });
    }

    const skip = (page - 1) * limit; // Calculate how many records to skip

    // Get total document count
    const totalRecords = await ProductWarrantyModal.countDocuments();

    // Fetch paginated data
    const data = await ProductWarrantyModal.find({})
      .sort({ _id: -1 })  // Sort by latest
      .skip(skip)  // Skip records for pagination
      .limit(limit)  // Limit results
      .select("brandName productName isDeleted numberOfGenerate warrantyInDays createdAt records.uniqueId records.batchNo");

    // Send response
    res.json({
      status: true,
      data,
      totalRecords,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
    });

  } catch (err) {
    console.error("Error fetching product warranties:", err);
    res.status(500).json({ status: false, msg: "Internal Server Error", error: err.message });
  }
};



// const getAllProductWarrantyByIdWithPage = async (req, res) => {
//   try {
//     // console.log(req.params);

//     const { id: brandId } = req.params;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     const totalRecords = await ProductWarrantyModal.countDocuments({ brandId });

//     const warranties = await ProductWarrantyModal.find({ brandId })
//       .sort({ _id: -1 })
//       .skip(skip)
//       .limit(limit);

//     res.status(200).send({ data: warranties, totalRecords });
//   } catch (err) {
//     res.status(400).send({ error: "Error fetching product warranties", details: err.message });
//   }
// };

//21032025
const getAllProductWarrantyByIdWithPage = async (req, res) => {
  try {
    const { id: brandId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1); // Ensure page is at least 1
    const limit = Math.max(1, parseInt(req.query.limit) || 10); // Ensure limit is at least 1
    const skip = (page - 1) * limit;

    // Validate if brandId is provided
    if (!brandId) {
      return res.status(400).json({ status: false, msg: "Brand ID is required" });
    }

    // Fetch total count of records matching the brandId
    const totalRecords = await ProductWarrantyModal.countDocuments({ brandId });

    // Fetch paginated records with selected fields
    const warranties = await ProductWarrantyModal.find({ brandId })
      .sort({ _id: -1 }) // Newest first
      .skip(skip)
      .limit(limit)
      .select("brandName productName isDeleted numberOfGenerate warrantyInDays createdAt records.uniqueId records.batchNo"); // Fetch only necessary fields

    res.status(200).json({
      status: true,
      data: warranties,
      totalRecords,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
    });

  } catch (err) {
    console.error("Error fetching product warranties:", err);
    res.status(500).json({
      status: false,
      msg: "Internal Server Error",
      error: err.message,
    });
  }
};

const getAllProductWarrantyByBrandStickers = async (req, res) => {
  try {
    const stickersByBrand = await ProductWarrantyModal.aggregate([
      {
        $group: {
          _id: { brandId: "$brandId", brandName: "$brandName" }, // Group by brandId & brandName
          totalStickers: { $sum: 1 }, // Count total stickers per brand
          totalnumberOfGenerate: { $sum: "$numberOfGenerate" } // Sum the actual field
        }
      },
      {
        $project: {
          _id: 0,
          brandId: "$_id.brandId",
          brandName: "$_id.brandName",
          totalStickers: 1,
          totalnumberOfGenerate: 1
        }
      }
    ]);

    res.status(200).json({ success: true, data: stickersByBrand });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const getAllProductWarrantyById = async (req, res) => {
  try {
    const { id: brandId } = req.params;

    const warranties = await ProductWarrantyModal.aggregate([
      { $match: { brandId } }, // Filter by brandId
      { $sort: { _id: -1 } }, // Sort by _id in descending order
    ]);

    if (warranties.length === 0) {
      return res.status(404).send({ error: "No warranties found for this brand" });
    }

    res.status(200).send(warranties);
  } catch (err) {
    res.status(400).send({ error: "Error fetching product warranties", details: err.message });
  }
};


const getAllProductWarrantyByBrandIdTotal = async (req, res) => {
  try {
    const { id } = req.params; // Get brandId from the URL params
    // console.log("brandId:", brandId);
    const brandId = id;
    // Find warranties matching the brandId
    const result = await ProductWarrantyModal.aggregate([
      { $match: { brandId } }, // Match documents with the specific brandId
      { $group: { _id: null, totalNumberOfGenerate: { $sum: "$numberOfGenerate" } } } // Sum up the numberOfGenerate
    ]);

    // If no data is found, return 0
    const totalNumberOfGenerate = result.length > 0 ? result[0].totalNumberOfGenerate : 0;

    res.status(200).send({ totalNumberOfGenerate });
  } catch (err) {
    res.status(400).send({ error: "Error fetching total number of generate", details: err.message });
  }
}


const getAllActivationWarranty = async (req, res) => {
  try {
    const data = await ProductWarrantyModal.aggregate([
      { $unwind: "$records" }, // Deconstruct the records array
      { $match: { "records.isActivated": true } }, // Filter only activated records
      {
        $project: {
          _id: "$records._id",
          brandName: "$records.brandName",
          brandId: "$records.brandId",
          productName: "$records.productName",
          productId: "$records.productId",
          categoryId: "$records.categoryId",
          categoryName: "$records.categoryName",
          uniqueId: "$records.uniqueId",
          year: "$records.year",
          batchNo: "$records.batchNo",
          warrantyInDays: "$records.warrantyInDays",
          qrCodes: "$records.qrCodes",
          userId: "$records.userId",
          userName: "$records.userName",
          email: "$records.email",
          contact: "$records.contact",
          address: "$records.address",
          lat: "$records.lat",
          long: "$records.long",
          pincode: "$records.pincode",
          district: "$records.district",
          state: "$records.state",
          complaintId: "$records.complaintId",
          activationDate: "$records.activationDate",
          isActivated: "$records.isActivated",
          termsCondtions: "$records.termsCondtions",
        },
      },
      // { $sort: { _id: -1 } },
      { $sort: { activationDate: -1 } },
    ]);

    res.send(data);
  } catch (err) {
    res.status(400).send(err);
  }
};

const getAllActivationWarrantyWithPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default page = 1
    const limit = parseInt(req.query.limit) || 10; // Default limit = 10
    const skip = (page - 1) * limit;

    const result = await ProductWarrantyModal.aggregate([
      { $unwind: "$records" },
      { $match: { "records.isActivated": true } },
      {
        $project: {
          _id: "$records._id",
          brandName: "$records.brandName",
          brandId: "$records.brandId",
          productName: "$records.productName",
          productId: "$records.productId",
          categoryId: "$records.categoryId",
          categoryName: "$records.categoryName",
          uniqueId: "$records.uniqueId",
          year: "$records.year",
          batchNo: "$records.batchNo",
          warrantyInDays: "$records.warrantyInDays",
          qrCodes: "$records.qrCodes",
          userId: "$records.userId",
          userName: "$records.userName",
          email: "$records.email",
          contact: "$records.contact",
          address: "$records.address",
          lat: "$records.lat",
          long: "$records.long",
          pincode: "$records.pincode",
          district: "$records.district",
          state: "$records.state",
          complaintId: "$records.complaintId",
          activationDate: "$records.activationDate",
          isActivated: "$records.isActivated",
          termsCondtions: "$records.termsCondtions",
        }
      },
      { $sort: { activationDate: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }]
        }
      }
    ]);

    const data = result[0]?.data || [];
    const total = result[0]?.totalCount[0]?.count || 0;

    res.send({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      data
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// const getActivationWarrantySearch = async (req, res) => {
//   try {
//     const { search = "" } = req.query;
//     // console.log("Received search query:", search);
//   if (search.trim() === "") {
//       // return empty array if no search term
//       return res.json({ success: true, count: 0, data: [] });
//     }
//     // Base pipeline - unwind records, match isActivated true
//     const pipeline = [
//       { $unwind: "$records" },
//       { $match: { "records.isActivated": true } },
//     ];

//     // If search term is provided, add regex matching
//     if (search.trim() !== "") {
//       const regex = new RegExp(search, "i");
//       pipeline.push({
//         $match: {
//           $or: [
//             { "records.userName": regex },
//             { "records.contact": regex },
//             { "records.pincode": regex },
//             { "records.uniqueId": regex },
//             { "records.brandName": regex },
//           ],
//         },
//       });
//     }

//     // Project fields you want in output
//     pipeline.push(
//       {
//         $project: {
//           _id: "$records._id",
//           brandName: "$records.brandName",
//           brandId: "$records.brandId",
//           productName: "$records.productName",
//           productId: "$records.productId",
//           categoryId: "$records.categoryId",
//           categoryName: "$records.categoryName",
//           uniqueId: "$records.uniqueId",
//           year: "$records.year",
//           batchNo: "$records.batchNo",
//           warrantyInDays: "$records.warrantyInDays",
//           qrCodes: "$records.qrCodes",
//           userId: "$records.userId",
//           userName: "$records.userName",
//           email: "$records.email",
//           contact: "$records.contact",
//           address: "$records.address",
//           lat: "$records.lat",
//           long: "$records.long",
//           pincode: "$records.pincode",
//           district: "$records.district",
//           state: "$records.state",
//           complaintId: "$records.complaintId",
//           activationDate: "$records.activationDate",
//           isActivated: "$records.isActivated",
//           termsCondtions: "$records.termsCondtions",
//         },
//       },
//       { $sort: { activationDate: -1 } }
//     );

//     // console.log("Aggregation pipeline:", JSON.stringify(pipeline, null, 2));

//     // Run aggregation
//     const data = await ProductWarrantyModal.aggregate(pipeline);
//     // console.log("Found results count:", data.length);

//     // Send response
//     res.json({
//       success: true,
//       count: data.length,
//       data,
//     });
//   } catch (err) {
//     console.error("Aggregation error:", err);
//     res.status(500).json({ success: false, error: "Server error" });
//   }
// };

const getActivationWarrantySearch = async (req, res) => {
  try {
    const { search = "" } = req.query;

    if (search.trim() === "") {
      return res.json({ success: true, count: 0, data: [] });
    }

    const searchTerm = search.trim();

    const pipeline = [
      { $unwind: "$records" },
      { $match: { "records.isActivated": true } },
      {
        $match: {
          $or: [
            { "records.userName": { $regex: `^${searchTerm}$`, $options: "i" } },
            { "records.contact": { $regex: `^${searchTerm}$`, $options: "i" } },
            { "records.pincode": { $regex: `^${searchTerm}$`, $options: "i" } },
            { "records.uniqueId": { $regex: `^${searchTerm}$`, $options: "i" } },
            { "records.brandName": { $regex: `^${searchTerm}$`, $options: "i" } },
          ],
        },
      },
      {
        $project: {
          _id: "$records._id",
          brandName: "$records.brandName",
          brandId: "$records.brandId",
          productName: "$records.productName",
          productId: "$records.productId",
          categoryId: "$records.categoryId",
          categoryName: "$records.categoryName",
          uniqueId: "$records.uniqueId",
          year: "$records.year",
          batchNo: "$records.batchNo",
          warrantyInDays: "$records.warrantyInDays",
          qrCodes: "$records.qrCodes",
          userId: "$records.userId",
          userName: "$records.userName",
          email: "$records.email",
          contact: "$records.contact",
          address: "$records.address",
          lat: "$records.lat",
          long: "$records.long",
          pincode: "$records.pincode",
          district: "$records.district",
          state: "$records.state",
          complaintId: "$records.complaintId",
          activationDate: "$records.activationDate",
          isActivated: "$records.isActivated",
          termsCondtions: "$records.termsCondtions",
        },
      },
      { $sort: { activationDate: -1 } },
    ];

    const data = await ProductWarrantyModal.aggregate(pipeline);

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    console.error("Aggregation error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};




const getActivationWarrantyByUserId = async (req, res) => {
  try {
    const { id } = req.params;
    // console.log("Requested User ID:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid ID format" });
    }

    const objectId = new mongoose.Types.ObjectId(id);
    const stringId = id.toString();

    const data = await ProductWarrantyModal.aggregate([
      { $unwind: "$records" },
      {
        $match: {
          $or: [
            { "records.userId": objectId }, // Match ObjectId format
            { "records.userId": stringId }  // Match string format
          ]
        }
      },
      {
        $project: {
          _id: "$records._id",
          brandName: "$records.brandName",
          brandId: "$records.brandId",
          productName: "$records.productName",
          productId: "$records.productId",
          categoryId: "$records.categoryId",
          categoryName: "$records.categoryName",
          uniqueId: "$records.uniqueId",
          year: "$records.year",
          batchNo: "$records.batchNo",
          warrantyInDays: "$records.warrantyInDays",
          qrCodes: "$records.qrCodes",
          userId: "$records.userId", // Include userId in the response
          userName: "$records.userName",
          email: "$records.email",
          contact: "$records.contact",
          address: "$records.address",
          lat: "$records.lat",
          long: "$records.long",
          pincode: "$records.pincode",
          district: "$records.district",
          state: "$records.state",
          complaintId: "$records.complaintId",
          activationDate: "$records.activationDate",
          isActivated: "$records.isActivated",
          termsCondtions: "$records.termsCondtions",
        },
      },
      {
        $sort: { activationDate: -1 }, // Sort by activationDate in descending order
      },
    ]);

    if (!data || data.length === 0) {
      return res.status(404).send({ message: "Record not found" });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send({ message: "Error fetching data", error: error.message });
  }
};


const getActivationWarrantyById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid ID format' });
    }

    // console.log("Requested ID:", id); // Debug log

    // Use the `new` keyword to instantiate ObjectId
    const objectId = new mongoose.Types.ObjectId(id);

    // Use aggregate to find the matching record
    const data = await ProductWarrantyModal.aggregate([
      {
        $unwind: "$records"  // Deconstruct the records array
      },
      {
        $match: { "records._id": objectId }  // Correct usage of ObjectId
      },
      {
        $project: {
          _id: "$records._id",
          brandName: "$records.brandName",
          brandId: "$records.brandId",
          productName: "$records.productName",
          productId: "$records.productId",
          categoryId: "$records.categoryId",
          categoryName: "$records.categoryName",
          uniqueId: "$records.uniqueId",
          year: "$records.year",
          batchNo: "$records.batchNo",
          warrantyInDays: "$records.warrantyInDays",
          qrCodes: "$records.qrCodes",
          userId: "$records.userId",
          userName: "$records.userName",
          email: "$records.email",
          contact: "$records.contact",
          address: "$records.address",
          lat: "$records.lat",
          long: "$records.long",
          pincode: "$records.pincode",
          district: "$records.district",
          state: "$records.state",
          complaintId: "$records.complaintId",
          activationDate: "$records.activationDate",
          isActivated: "$records.isActivated",
          termsCondtions: "$records.termsCondtions",
        },
      },
    ]);

    // Check if no data is found
    if (!data || data.length === 0) {
      return res.status(404).send({ message: 'Record not found' });
    }

    // Return the found record
    res.status(200).json(data[0]);
  } catch (error) {
    // Handle any errors
    console.error('Error fetching data:', error);
    res.status(500).send({ message: "Error fetching data", error: error.message });
  }
};






const getProductWarrantyById = async (req, res) => {
  try {
    let _id = req.params.id;
    let data = await ProductWarrantyModal.findById(_id);
    res.send(data);
  } catch (err) {
    res.status(400).send(err);
  }
}

//old before 22/03/2025
// const getProductWarrantyByUniqueId = async (req, res) => {
//   try {
//     const uniqueId = req.params.id;
//     // console.log("Searching for uniqueId:", uniqueId);

//     // Search for a document where the `uniqueId` exists in the `records` array
//     const data = await ProductWarrantyModal.findOne({
//       'records.uniqueId': uniqueId
//     });

//     if (!data) {
//       return res.status(404).send({ message: "Product warranty not found" });
//     }

//     res.send(data);
//   } catch (err) {
//     console.error("Error:", err);
//     res.status(400).send({ error: err.message });
//   }
// };

const getProductWarrantyByUniqueId = async (req, res) => {
  try {
    const uniqueId = req.params.id?.trim();

    if (!uniqueId) {
      return res.status(400).json({ message: "Unique ID is required" });
    }

    // Optimized Query: Using Projection & .lean()
    const data = await ProductWarrantyModal.findOne(
      { "records.uniqueId": uniqueId },
      { "records.$": 1, brandName: 1, brandId: 1, productName: 1, productId: 1, categoryId: 1 } // Returns only the matched record
    ).lean(); // Makes query lightweight by returning plain JS object

    if (!data) {
      return res.status(404).json({ message: "Product warranty not found" });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching product warranty:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
};


const editProductWarranty = async (req, res) => {
  try {
    let _id = req.params.id;
    let body = req.body;
    let data = await ProductWarrantyModal.findByIdAndUpdate(_id, body);
    res.json({ status: true, msg: "Product warranty Updated" });
  } catch (err) {
    res.status(500).send(err);
  }
}
const editActivationWarranty = async (req, res) => {
  const { uniqueId, updates } = req.body;
  // console.log("uniqueId", uniqueId);

  // Ensure both uniqueId and updates are present
  if (!uniqueId || !updates) {
    return res.status(400).json({ error: 'UniqueId and updates are required.' });
  }

  try {
    // Define the fields to be updated dynamically
    const updateFields = {};
    if (updates.userName) updateFields['records.$[record].userName'] = updates.userName;
    if (updates.contact) updateFields['records.$[record].contact'] = updates.contact;
    if (updates.email) updateFields['records.$[record].email'] = updates.email;
    if (updates.address) updateFields['records.$[record].address'] = updates.address;
    if (updates.lat) updateFields['records.$[record].lat'] = updates.lat;
    if (updates.long) updateFields['records.$[record].long'] = updates.long;
    if (updates.pincode) updateFields['records.$[record].pincode'] = updates.pincode;
    if (updates.isActivated !== undefined) updateFields['records.$[record].isActivated'] = updates.isActivated;

    // Perform the update using arrayFilters to update only the matching record
    const updatedDoc = await ProductWarrantyModal.findOneAndUpdate(
      { 'records.uniqueId': uniqueId }, // Find document that contains the matching uniqueId in records array
      { $set: updateFields }, // Apply updates to the matched record
      {
        new: true, // Return the updated document
        arrayFilters: [{ 'record.uniqueId': uniqueId }] // Filter to match the specific record in the array
      }
    );

    // console.log("updatedDoc", updatedDoc);

    // If no document is found with the matching uniqueId, return a 404
    if (!updatedDoc) {
      return res.status(404).json({ error: 'Record not found.' });
    }

    // Return success response with updated document
    res.status(200).json({ message: 'Record updated successfully.', data: updatedDoc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating the record.' });
  }
};



const deleteProductWarranty = async (req, res) => {
  try {
    let _id = req.params.id;
    const result = await ProductWarrantyModal.findByIdAndUpdate(
      _id,
      { isDeleted: true },
      { new: true }
    );
    res.json({ status: true, msg: "Product warranty Deteled", data: result });
  } catch (err) {
    res.status(500).send(err);
  }
}

// const deleteProductWarranty = async (req, res) => {
//   try {
//     let _id = req.params.id;
//     let data = await ProductWarrantyModal.findByIdAndDelete(_id);
//     res.json({ status: true, msg: "Product warranty Deteled" });
//   } catch (err) {
//     res.status(500).send(err);
//   }
// }



module.exports = { addProductWarranty, activateWarranty, getAllProductWarranty, getAllProductWarrantyByBrandStickers, getAllProductWarrantyWithPage, getAllProductWarrantyByIdWithPage, getAllProductWarrantyByBrandIdTotal, getAllProductWarrantyById, getActivationWarrantySearch, getAllActivationWarrantyWithPage, getAllActivationWarranty, getActivationWarrantyByUserId, getActivationWarrantyById, getProductWarrantyByUniqueId, getProductWarrantyById, editActivationWarranty, editProductWarranty, deleteProductWarranty };
