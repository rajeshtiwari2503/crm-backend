const ProductWarrantyModal = require("../models/productWarranty")
const { UserModel } = require('../models/registration');
const QRCode = require('qrcode');
const mongoose = require('mongoose');





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

//     // ✅ Validate required fields
//     if (!brandName || !brandId || !numberOfGenerate || !warrantyInDays) {
//       return res.status(400).json({ status: false, msg: 'Missing required fields' });
//     }

//     // ✅ Ensure numberOfGenerate is a valid positive integer
//     const numberOfRecords = parseInt(numberOfGenerate, 10);
//     if (isNaN(numberOfRecords) || numberOfRecords <= 0) {
//       return res.status(400).json({ status: false, msg: 'Invalid numberOfGenerate' });
//     }

//     console.log(`🔹 Total records to generate: ${numberOfRecords}`);

//     const batchSize = 100; // ✅ Adjust batch size as needed
//     let generatedRecords = [];
//     let failedRecords = 0;

//     for (let i = 0; i < numberOfRecords; i += batchSize) {
//       const batchPromises = [];

//       for (let j = 0; j < Math.min(batchSize, numberOfRecords - i); j++) {
//         batchPromises.push(generateUniqueRecord(i + j, req.body));
//       }

//       const batchResults = await Promise.allSettled(batchPromises);

//       batchResults.forEach((result, index) => {
//         if (result.status === "fulfilled") {
//           generatedRecords.push(result.value);
//         } else {
//           console.error(`⚠️ Failed record #${i + index + 1}:`, result.reason);
//           failedRecords++;
//         }
//       });

//       console.log(`✅ Processed batch ${i / batchSize + 1}, total records so far: ${generatedRecords.length}`);

//       // ✅ Small delay to prevent MongoDB from being overwhelmed
//       await new Promise(resolve => setTimeout(resolve, 100));
//     }

//     if (generatedRecords.length === 0) {
//       return res.status(500).json({ status: false, msg: 'No records were created due to errors' });
//     }

//     // ✅ Save all records at once using insertMany() for better performance
//     try {
//       const savedMetadata = await ProductWarrantyModal.create({
//         brandName,
//         brandId,
//         productName,
//         numberOfGenerate,
//         warrantyInDays,
//         year,
//         id: new mongoose.Types.ObjectId(),
//         records: generatedRecords,
//       });

//       console.log(`✅ Warranty Created Successfully: ${generatedRecords.length} records saved`);

//       res.status(201).json({
//         status: true,
//         msg: `Warranty Created Successfully with ${generatedRecords.length} records`,
//         failedRecords,
//         data: savedMetadata,
//       });
//     } catch (dbError) {
//       console.error("❌ MongoDB Insert Error:", dbError);
//       return res.status(500).json({ status: false, msg: 'Error saving records to database', error: dbError.message });
//     }

//   } catch (error) {
//     console.error("❌ Error in addProductWarranty:", error);

//     if (error.code === 11000) {
//       return res.status(409).json({ status: false, msg: 'Duplicate uniqueId found' });
//     }

//     res.status(500).json({ status: false, msg: 'Internal Server Error', error: error.message });
//   }
// };



// const generateUniqueRecord = async (index, data) => {
//   let uniqueId;
//   let qrCodeUrl;

//   // Retry logic to handle duplicate key errors
//   for (let retry = 0; retry < 5; retry++) {
//     try {
//       uniqueId = await generateUniqueId();

//       // Check once more before using this uniqueId if it already exists in the database
//       const existingRecord = await ProductWarrantyModal.findOne({ 'records.uniqueId': uniqueId });
//       if (existingRecord) {
//         console.log(`Duplicate uniqueId detected: ${uniqueId}, retrying...`);
//         continue; // Retry if this uniqueId already exists
//       }

//       const qrCodeUrl1 = `https://crm.servsy.in/warrantyActivation?uniqueId=${uniqueId}`;
//       qrCodeUrl = await QRCode.toDataURL(qrCodeUrl1);
//       break; // Exit loop if successful
//     } catch (error) {
//       if (error.code === 11000 && retry < 4) {
//         console.log(`Duplicate uniqueId during insert: ${uniqueId}, retrying...`);
//         continue;
//       }
//       throw error; // Rethrow error if it's not a duplicate key error or retries exceeded
//     }
//   }

//   return {
//     productName: data.productName,
//     productId: data.productId,
//     categoryId: data.categoryId,
//     brandId: data.brandId,
//     brandName: data.brandName,
//     categoryName: data.categoryName,
//     subCategoryId: data.subCategoryId,
//     subCategoryName: data.subCategoryName,
//     uniqueId,
//     year: data.year,
//     batchNo: data.batchNo,
//     warrantyInDays: data.warrantyInDays,
//     qrCodes: [{ qrCodeUrl, index: index + 1 }],
//   };
// };

// Generates a uniqueId and checks database for uniqueness
// const generateUniqueId = async () => {
//   let uniqueId;
//   let isUnique = false;

//   while (!isUnique) {
//     // uniqueId = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit number
//     uniqueId = Math.floor(1000000 + Math.random() * 9000000).toString(); // ✅ 7-digit unique ID

//     // Check if this uniqueId already exists in the database
//     const existingRecord = await ProductWarrantyModal.findOne({ 'records.uniqueId': uniqueId });
//     if (!existingRecord) {
//       isUnique = true;
//     }
//   }

//   return uniqueId;
// };




/**
 * ✅ Generate a large batch of unique IDs safely:
 * 1. Generate in-memory (fast)
 * 2. Single DB query to remove existing IDs (safe)
 */

/**
 * ✅ Retry helper for Mongo insert operations
 */

/**
 * ✅ Generate unique IDs safely (your code)
 */
const generateSafeUniqueIds = async (count) => {
  const uniqueIds = new Set();

  // Step 1: Generate random IDs
  while (uniqueIds.size < count) {
    uniqueIds.add(Math.floor(1000000 + Math.random() * 9000000).toString());
  }

  // Step 2: Check existing IDs in DB
  const existing = await ProductWarrantyModal.find(
    { "records.uniqueId": { $in: Array.from(uniqueIds) } },
    { "records.uniqueId": 1, _id: 0 }
  );

  const existingIds = new Set(
    existing.flatMap((r) => r.records.map((rr) => rr.uniqueId))
  );

  // Step 3: Remove duplicates and refill
  for (const id of existingIds) uniqueIds.delete(id);

  while (uniqueIds.size < count) {
    const newId = Math.floor(1000000 + Math.random() * 9000000).toString();
    if (!existingIds.has(newId)) uniqueIds.add(newId);
  }

  console.log(
    `✅ Generated ${uniqueIds.size} unique IDs (removed ${existingIds.size} duplicates)`
  );

  return Array.from(uniqueIds);
};

/**
 * ✅ Helper: Retry insert on Mongo network timeout
 */
const retryInsert = async (data) => {
  let retries = 3;
  while (retries > 0) {
    try {
      await ProductWarrantyModal.insertMany(data, { ordered: false });
      return;
    } catch (err) {
      if (err.name === "MongoNetworkTimeoutError" && retries > 0) {
        retries--;
        console.warn(`Retrying insert... (${3 - retries}/3)`);
      } else {
        throw err;
      }
    }
  }
};

/**
 * ✅ Concurrency controller for QR code generation
 */
const runWithConcurrency = async (items, limit, fn) => {
  const results = [];
  let index = 0;

  const worker = async () => {
    while (index < items.length) {
      const current = index++;
      try {
        results[current] = await fn(items[current], current);
      } catch (err) {
        results[current] = { error: err };
      }
    }
  };

  const workers = Array.from({ length: limit }, worker);
  await Promise.all(workers);
  return results;
};

/**
 * ✅ Main API to generate Product Warranty with QR codes
 */
const addProductWarranty = async (req, res) => {
  try {
    const {
      productName = "",
      productId = "",
      categoryId = "",
      categoryName = "",
      subCategoryId = "",
      subCategoryName = "",
      year = new Date().getFullYear(),
      numberOfGenerate,
      batchNo,
      warrantyInDays,
      brandName,
      brandId,
    } = req.body;

    // Validate input
    if (!brandName || !brandId || !numberOfGenerate || !warrantyInDays) {
      return res
        .status(400)
        .json({ status: false, msg: "Missing required fields" });
    }

    const numberOfRecords = parseInt(numberOfGenerate, 10);
    if (isNaN(numberOfRecords) || numberOfRecords <= 0) {
      return res
        .status(400)
        .json({ status: false, msg: "Invalid numberOfGenerate" });
    }

    console.time("Warranty Generation");
    console.log(`🔹 Generating ${numberOfRecords} warranty stickers...`);

    // 1️⃣ Generate unique IDs
    const uniqueIds = await generateSafeUniqueIds(numberOfRecords);

    // 2️⃣ Generate QR codes concurrently (limit 20)
    const records = await runWithConcurrency(
      uniqueIds,
      20,
      async (uniqueId, index) => {
        const qrCodeUrl1 = `https://crm.servsy.in/warrantyActivation?uniqueId=${uniqueId}`;
        const qrCodeUrl = await QRCode.toDataURL(qrCodeUrl1);

        return {
          brandName,
          brandId,
          productName,
          productId,
          categoryId,
          categoryName,
          subCategoryId,
          subCategoryName,
          uniqueId,
          year: new Date().toISOString(),
          batchNo,
          warrantyInDays,
          qrCodes: [
            {
              qrCodeUrl,
              index: index + 1,
              _id: new mongoose.Types.ObjectId(),
            },
          ],
          status: "INITIATE",
          reviewedBy: "",
          reviewedAt: null,
          termsCondtions: false,
          isActivated: false,
          _id: new mongoose.Types.ObjectId(),
        };
      }
    );

    const validRecords = records.filter((r) => !r.error);
    const failedRecords = records.length - validRecords.length;

    if (validRecords.length === 0) {
      return res
        .status(500)
        .json({ status: false, msg: "No records were created due to errors" });
    }

    // 3️⃣ Save all records in one document
    await retryInsert([
      {
        id: new mongoose.Types.ObjectId(),
        brandName,
        brandId,
        productName,
        productId,
        categoryId,
        categoryName,
        subCategoryId,
        subCategoryName,
        numberOfGenerate,
        warrantyInDays,
        batchNo,
        year,
        isDeleted: false,
        records: validRecords,
      },
    ]);

    console.timeEnd("Warranty Generation");
    console.log(
      `✅ Warranty Created Successfully: ${validRecords.length} records saved`
    );

    res.status(201).json({
      status: true,
      msg: `Warranty Created Successfully with ${validRecords.length} records`,
      failedRecords,
    });
  } catch (error) {
    console.error("❌ Error in addProductWarranty:", error);
    res.status(500).json({
      status: false,
      msg: "Internal Server Error",
      error: error.message,
    });
  }
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
    //  const io = req.app.get('socketio');
    //     if (io) {
    //       const payload = {   
    //           uniqueId: record.uniqueId,
    //           productName: record.productName,
    //           productId: record.productId,
    //           fullName: record.userName,
    //           email: record.email,
    //           contact: record.contact,
    //           address: record.address,
    //           district: record.district,
    //           state: record.state,
    //           pincode: record.pincode,
    //           activationDate: record.activationDate,
    //         message: `Warranty activated for ${record.productName} by ${record.userName} (${record.brandName || 'N/A'})`,
    //       };
    //       io.emit('warrantyActivated', payload);
    //       // console.log('📢 Emitted warrantyActivated:', payload);
    //     } else {
    //       console.warn('⚠️ Socket.IO instance not found.');
    //     }
    res.status(200).json({
      status: true,
      msg: 'Warranty activated successfully',
      data: record, // Return only the activated record
    });
  } catch (error) {
    res.status(500).json({ status: false, msg: error.message });
  }



};

// const activateWarrantyWithImage = async (req, res) => {
//   try {
//     const { name, contact, email, address, lat, long, pincode, district, state, password, uniqueId, } = req.body;
//     const productId = req.body.productId
//     // console.log("");

//     // if (!name || !contact || !address || !uniqueId) {
//     //   return res.status(400).json({ status: false, msg: 'Missing required fields' });
//     // }

//     // Check if the user already exists
//     let user = await UserModel.findOne({ contact });
//     if (!user) {
//       // Hash the password and create a new user


//       user = new UserModel({

//         name,
//         contact,
//         email,
//         address,
//         password,
//         lat, long, pincode
//       });
//       await user.save();
//     }

//     const warrantyImage = req.file ? req.file?.location : null;

//     // Find the warranty record based on the unique ID
//     // const warranty = await ProductWarrantyModal.findOne({ 'records.uniqueId': uniqueId });
//     const warranty=await ProductWarrantyModal.findOne(
//       { "records.uniqueId": uniqueId },
//       { "records.$": 1 } // include only matching record, exclude qrCodes
//     ).lean();
//     if (!warranty) {
//       return res.status(404).json({ status: false, msg: 'Warranty not found' });
//     }
// console.log("warranty",warranty);

//     // Find the specific record with the matching uniqueId
//     const record = warranty.records.find(record => record.uniqueId === uniqueId);
//     if (!record) {
//       return res.status(404).json({ status: false, msg: 'Warranty record not found' });
//     }
// console.log("record",record);
//     // Check if the warranty has already been activated
//     if (record.isActivated) {
//       return res.status(400).json({ status: false, msg: 'This warranty has already been activated' });
//     }
//     lat, long, pincode,
//       // Activate the warranty
//       record.isActivated = true;
//     record.userName = user.name;
//     record.userId = user._id;
//     record.email = email;
//     record.contact = contact;
//     record.address = address;
//     record.lat = lat;
//     record.long = long;
//     record.district = district;
//     record.state = state;
//     record.pincode = pincode;
//     record.termsCondtions = req.body.termsCondtions;
//     record.status = "PENDING";
//     record.activationDate = new Date();
//     if (warrantyImage) {
//       record.warrantyImage = warrantyImage; // e.g., local path or S3 URL
//     }
//     if (productId) {
//       record.productName = req.body.productName;
//       record.productId = productId;
//       record.categoryName = req.body.categoryName;
//       record.categoryId = req.body.categoryId;
//       record.year = req.body.year;
//     }
//     // Save the updated warranty
//     await warranty.save();

//     res.status(200).json({
//       status: true,
//       msg: "Warranty activated successfully and will be approved after verification.",
//       data: record, // Return only the activated record
//     });
//   } catch (error) {
//     res.status(500).json({ status: false, msg: error.message });
//   }



// };

const activateWarrantyWithImage = async (req, res) => {
  try {
    const {
      name,
      contact,
      email,
      address,
      lat,
      long,
      pincode,
      district,
      state,
      password,
      uniqueId,
      termsCondtions,
      productId,
      productName,
      categoryName,
      categoryId,
      year,purchaseDate,
    } = req.body;
// console.log("req.body",req.body);
 
    if (!uniqueId || !contact) {
      return res.status(400).json({ status: false, msg: "uniqueId and contact are required" });
    }

    // 🔹 Step 1: Find or create user
    let user = await UserModel.findOne({ contact }).lean();
    if (!user) {
      const newUser = new UserModel({
        name,
        contact,
        email,
        address,
        password,
        lat,
        long,
        pincode,
      });
      user = await newUser.save();
    }

    const warrantyImage = req.file?.location || null;

    // 🔹 Step 2: Check if warranty record exists and not activated
    const existing = await ProductWarrantyModal.findOne(
      { "records.uniqueId": uniqueId },
      { "records.$": 1 }
    ).lean();

    if (!existing || !existing.records || !existing.records.length) {
      return res.status(404).json({ status: false, msg: "Warranty record not found" });
    }

    const record = existing.records[0];
    if (record.isActivated) {
      return res.status(400).json({ status: false, msg: "This warranty has already been activated" });
    }

    // 🔹 Step 3: Prepare update payload
    const updateFields = {
      "records.$.isActivated": true,
      "records.$.userName": user.name,
      "records.$.userId": user._id,
      "records.$.email": email,
      "records.$.contact": contact,
      "records.$.address": address,
      "records.$.lat": lat,
      "records.$.long": long,
      "records.$.district": district,
      "records.$.state": state,
      "records.$.pincode": pincode,
      "records.$.termsCondtions": !!termsCondtions,
      "records.$.status": "PENDING",
      "records.$.activationDate": purchaseDate?purchaseDate: new Date(),
    };

    if (warrantyImage) updateFields["records.$.warrantyImage"] = warrantyImage;
    if (productId) {
      updateFields["records.$.productId"] = productId;
      updateFields["records.$.productName"] = productName;
      updateFields["records.$.categoryId"] = categoryId;
      updateFields["records.$.categoryName"] = categoryName;
      updateFields["records.$.year"] = year;
    }

    // 🔹 Step 4: Update the record atomically (fast, safe)
    const updateResult = await ProductWarrantyModal.updateOne(
      { "records.uniqueId": uniqueId },
      { $set: updateFields }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(400).json({ status: false, msg: "No record updated" });
    }

    // 🔹 Step 5: Fetch updated record in a second query
    const updatedDoc = await ProductWarrantyModal.findOne(
      { "records.uniqueId": uniqueId },
      { "records.$": 1 }
    ).lean();

    const updatedRecord = updatedDoc?.records?.[0];
    if (!updatedRecord) {
      return res.status(500).json({ status: false, msg: "Failed to retrieve updated record" });
    }

    if (updatedRecord.qrCodes) delete updatedRecord.qrCodes; // cleanup heavy field if needed

    // ✅ Done
    res.status(200).json({
      status: true,
      msg: "Warranty activated successfully and will be approved after verification.",
      data: updatedRecord,
    });
  } catch (error) {
    console.error("Error activating warranty:", error);
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

// const getAllProductWarrantyByBrandStickers = async (req, res) => {
//   try {
//     const stickersByBrand = await ProductWarrantyModal.aggregate([
//       {
//         $group: {
//           _id: { brandId: "$brandId", brandName: "$brandName" }, // Group by brandId & brandName
//           totalStickers: { $sum: 1 }, // Count total stickers per brand
//           totalnumberOfGenerate: { $sum: "$numberOfGenerate" } // Sum the actual field
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           brandId: "$_id.brandId",
//           brandName: "$_id.brandName",
//           totalStickers: 1,
//           totalnumberOfGenerate: 1
//         }
//       }
//     ]);

//     res.status(200).json({ success: true, data: stickersByBrand });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };


const getAllProductWarrantyByBrandStickers = async (req, res) => {
  try {
    const stickersByBrand = await ProductWarrantyModal.aggregate([
      {
        $group: {
          _id: "$brandId",
          brandName: { $first: "$brandName" }, // ✅ take brandName from one doc in the group
          totalStickers: { $sum: 1 },
          totalnumberOfGenerate: { $sum: "$numberOfGenerate" },
        },
      },
      {
        $project: {
          _id: 0,
          brandId: "$_id",
          brandName: 1,
          totalStickers: 1,
          totalnumberOfGenerate: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, data: stickersByBrand });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


//  const getProductWarrantyByBrandCategoryProduct = async (req, res) => {
//   try {
//     console.log("✅ API HIT");

//     const { id:brandId } = req.params // 👈 IMPORTANT
//     console.log("➡️ brandId:", brandId);
//     console.log("➡️ req.query:", req.params);

//     if (!brandId) {
//       return res.status(400).json({
//         success: false,
//         message: "brandId is required",
//       });
//     }

//     const data = await ProductWarrantyModal.aggregate([
//       {
//         $match: { brandId },
//       },
//       {
//         $group: {
//           _id: {
//             categoryId: "$categoryId",
//             categoryName: "$categoryName",
//             productId: "$productId",
//             productName: "$productName",
//           },
//           totalStickers: { $sum: 1 },
//           totalGenerated: {
//             $sum: { $toInt: "$numberOfGenerate" },
//           },
//         },
//       },
//       {
//         $group: {
//           _id: {
//             categoryId: "$_id.categoryId",
//             categoryName: "$_id.categoryName",
//           },
//           products: {
//             $push: {
//               productId: "$_id.productId",
//               productName: "$_id.productName",
//               totalStickers: "$totalStickers",
//               totalGenerated: "$totalGenerated",
//             },
//           },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           categoryId: "$_id.categoryId",
//           categoryName: "$_id.categoryName",
//           products: 1,
//         },
//       },
//     ]);

//     console.log("📊 Aggregation result:", data);

//     res.status(200).json({
//       success: true,
//       brandId,
//       data,
//     });
//   } catch (error) {
//     console.error("❌ ERROR:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };


 const getProductWarrantyByBrandCategoryProduct = async (req, res) => {
  try {
    const { id: brandId } = req.params;

    if (!brandId) {
      return res.status(400).json({
        success: false,
        message: "brandId is required",
      });
    }

    const data = await ProductWarrantyModal.aggregate([
      // Match only the selected brand and non-deleted records
      {
        $match: {
          brandId,
          isDeleted: false,
        },
      },

      // Group by category → subcategory → product
      {
        $group: {
          _id: {
            categoryId: "$categoryId",
            categoryName: "$categoryName",
            subCategoryId: "$subCategoryId",
            subCategoryName: "$subCategoryName",
            productId: "$productId",
            productName: "$productName",
          },
          totalStickers: { $sum: { $size: "$records" } },
          totalGenerated: { $sum: { $toInt: "$numberOfGenerate" } },
        },
      },

      // Group by category → subcategories array
      {
        $group: {
          _id: {
            categoryId: "$_id.categoryId",
            categoryName: "$_id.categoryName",
            subCategoryId: "$_id.subCategoryId",
            subCategoryName: "$_id.subCategoryName",
          },
          products: {
            $push: {
              productId: "$_id.productId",
              productName: "$_id.productName",
              totalStickers: "$totalStickers",
              totalGenerated: "$totalGenerated",
            },
          },
        },
      },

      // Group by category → subcategories array
      {
        $group: {
          _id: {
            categoryId: "$_id.categoryId",
            categoryName: "$_id.categoryName",
          },
          subcategories: {
            $push: {
              subCategoryId: "$_id.subCategoryId",
              subCategoryName: "$_id.subCategoryName",
              products: "$products",
            },
          },
        },
      },

      // Final projection
      {
        $project: {
          _id: 0,
          categoryId: "$_id.categoryId",
          categoryName: "$_id.categoryName",
          subcategories: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      brandId,
      data,
    });
  } catch (error) {
    console.error("❌ ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
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

// const getAllActivationWarrantyWithPage = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1; // Default page = 1
//     const limit = parseInt(req.query.limit) || 10; // Default limit = 10
//     const skip = (page - 1) * limit;

//     const result = await ProductWarrantyModal.aggregate([
//       { $unwind: "$records" },
//       { $match: { "records.isActivated": true } },
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
//           status: "$records.status",
//           warrantyImage: "$records.warrantyImage",
//           lat: "$records.lat",
//           long: "$records.long",
//           pincode: "$records.pincode",
//           district: "$records.district",
//           state: "$records.state",
//           complaintId: "$records.complaintId",
//           activationDate: "$records.activationDate",
//           isActivated: "$records.isActivated",
//           termsCondtions: "$records.termsCondtions",
//         }
//       },
//       { $sort: { activationDate: -1 } },
//       {
//         $facet: {
//           data: [{ $skip: skip }, { $limit: limit }],
//           totalCount: [{ $count: "count" }]
//         }
//       }
//     ]);

//     const data = result[0]?.data || [];
//     const total = result[0]?.totalCount[0]?.count || 0;

//     res.send({
//       success: true,
//       currentPage: page,
//       totalPages: Math.ceil(total / limit),
//       totalItems: total,
//       data
//     });
//   } catch (err) {
//     res.status(400).json({ success: false, error: err.message });
//   }
// };



const getAllActivationWarrantyWithPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { brandId } = req.query; // brandId optional

    // Dynamic match condition
    const matchCondition = { "records.isActivated": true };

    if (brandId) {
      matchCondition["records.brandId"] = brandId;
    }

    const result = await ProductWarrantyModal.aggregate([
      { $unwind: "$records" },

      // 👉 Match condition dynamically applied
      { $match: matchCondition },

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
          status: "$records.status",
          warrantyImage: "$records.warrantyImage",
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
          status:"$records.status",
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






// const getProductWarrantyById = async (req, res) => {
//   try {
//     let _id = req.params.id;
//     let data = await ProductWarrantyModal.findById(_id);
//     res.send(data);
//   } catch (err) {
//     res.status(400).send(err);
//   }
// }


const getProductWarrantyById = async (req, res) => {
  try {
    const _id = new mongoose.Types.ObjectId(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const limit = 1000; // number of records per page
    const skip = (page - 1) * limit;

    console.log(`📄 Page: ${page} ➡️ Skip: ${skip} Limit: ${limit}`);
    console.log(`🔍 Product ID: ${_id}`);

    // Step 1: Get total count of records without fetching all
    const countDoc = await ProductWarrantyModal.aggregate([
      { $match: { _id } },
      { $project: { totalRecords: { $size: "$records" } } },
    ]);

    if (!countDoc.length) {
      console.log("❌ Document not found");
      return res.status(404).json({ success: false, message: "Warranty not found" });
    }

    const totalRecords = countDoc[0].totalRecords;
    const totalPages = Math.ceil(totalRecords / limit);
    console.log(`📦 Total Records: ${totalRecords} | Total Pages: ${totalPages}`);

    // Step 2: Fetch document with limited records + all parent fields
    const result = await ProductWarrantyModal.aggregate([
      { $match: { _id } },
      {
        $project: {
          brandName: 1,
          brandId: 1,
          productName: 1,
          numberOfGenerate: 1,
          warrantyInDays: 1,
          year: 1,
          isDeleted: 1,
          createdAt: 1,
          updatedAt: 1,
          id: 1,
          // Only slice records here
          records: { $slice: ["$records", skip, limit] },
        },
      },
    ]);

    if (!result.length) {
      return res.status(404).json({ success: false, message: "No data found" });
    }

    const data = result[0];

    console.log(`✅ Fetched ${data.records.length} / ${totalRecords} records`);

    res.status(200).json({
      success: true,
      totalRecords,
      currentPage: page,
      totalPages,
      count: data.records.length,
      ...data, // includes brandName, productName, etc.
    });
  } catch (error) {
    console.error("🔥 Error fetching warranty data:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};






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
    return res.status(400).json({ status: false, error: 'UniqueId and updates are required.' });
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
    res.status(200).json({ status: true, msg: 'Record updated successfully.', data: updatedDoc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, msg: "An error occurred while updating the record.", error: 'An error occurred while updating the record.' });
  }
};

// const updateWarrantyStatus = async (req, res) => {
//   try {
//     const { uniqueId } = req.params;
//     const { status, adminName } = req.body; // now adminName is string

//     if (!["APPROVE", "DISAPPROVE"].includes(status)) {
//       return res.status(400).json({ success: false, msg: "Invalid status value" });
//     }

//     const warranty = await ProductWarrantyModal.findOne({ "records.uniqueId": uniqueId });
//     if (!warranty) {
//       return res.status(404).json({ success: false, msg: "Warranty not found" });
//     }

//     const record = warranty.records.find(r => r.uniqueId === uniqueId);
//     if (!record) {
//       return res.status(404).json({ status: false, msg: "Warranty record not found" });
//     }

//     // if (record.status !== "PENDING") {
//     //   return res.status(400).json({ success: false, msg: `Already ${record.status}` });
//     // }

//     record.status = status;
//     record.reviewedBy = adminName;  // store admin name
//     record.reviewedAt = new Date();

//     await warranty.save();

//     res.status(200).json({
//       success: true,
//       status: true,
//       msg: `Warranty has been ${status.toLowerCase()} successfully`,
//       data: record
//     });

//   } catch (error) {
//     res.status(500).json({ success: false, msg: error.message });
//   }
// };

 const updateWarrantyStatus = async (req, res) => {
  try {
    const { uniqueId } = req.params;
    const { status, adminName } = req.body;

    if (!["APPROVE", "DISAPPROVE"].includes(status)) {
      return res.status(400).json({ success: false, msg: "Invalid status value" });
    }

    // Update the specific record in-place
    const updateResult = await ProductWarrantyModal.updateOne(
      { "records.uniqueId": uniqueId },
      {
        $set: {
          "records.$.status": status,
          "records.$.reviewedBy": adminName,
          "records.$.reviewedAt": new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ success: false, msg: "Warranty record not found" });
    }

    // Fetch only the updated record
    const warranty = await ProductWarrantyModal.findOne(
      { "records.uniqueId": uniqueId },
      { "records.$": 1 } // fetch only the updated array element
    );

    res.status(200).json({
      success: true,
      status: true,
      msg: `Warranty has been ${status.toLowerCase()} successfully`,
      data: warranty.records[0]
    });

  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
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



module.exports = { addProductWarranty, updateWarrantyStatus, activateWarranty, activateWarrantyWithImage, getAllProductWarranty,getProductWarrantyByBrandCategoryProduct, getAllProductWarrantyByBrandStickers, getAllProductWarrantyWithPage, getAllProductWarrantyByIdWithPage, getAllProductWarrantyByBrandIdTotal, getAllProductWarrantyById, getActivationWarrantySearch, getAllActivationWarrantyWithPage, getAllActivationWarranty, getActivationWarrantyByUserId, getActivationWarrantyById, getProductWarrantyByUniqueId, getProductWarrantyById, editActivationWarranty, editProductWarranty, deleteProductWarranty };
