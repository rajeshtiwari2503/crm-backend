const ComplaintModal = require("../models/complaint")
const NotificationModel = require("../models/notification")
const { ServiceModel, EmployeeModel } = require("../models/registration")
const { UserModel, BrandRegistrationModel } = require("../models/registration")
const SubCategoryModal = require("../models/subCategory")
const BrandRechargeModel = require("../models/brandRecharge")
const WalletModel = require("../models/wallet")
const ProductWarrantyModal = require("../models/productWarranty")
const OrderModel = require("../models/order")
const ServicePaymentModel = require("../models/servicePaymentModel")

const moment = require('moment');

const stream = require("stream");
const drive = require("../googleConfig/googleAuth");


const { admin } = require('../firebase/index')
const { sendBlessTemplateSms } = require("../services/smsService")
const smsTemplates = require("../services/smsTemplate")



const addComplaint = async (req, res) => {
   try {
      const body = req.body;
      const {
         city,
         pincode,
         emailAddress,
         fullName,
         phoneNumber,
         serviceAddress,
         brandId,
         uniqueId,
         district,
         createEmpName,
         state,
      } = body;

      const email = emailAddress;
      const productName = body?.productName;
      const productId = body?.productId;
      const createEmpName1 = createEmpName || fullName;

      // Create or find user
      const user = await findOrCreateUser(email, fullName, phoneNumber, serviceAddress);

      // Handle warranty lookup and update
      if (uniqueId) {
         const success = await handleWarrantyUpdate(uniqueId, productName, productId, fullName, email, phoneNumber, serviceAddress, district, state, pincode);
         if (!success) {
            return res.status(404).json({ status: false, msg: 'Warranty record not found' });
         }
      }

      // Find service center
      const serviceCenter = await findServiceCenter(pincode, brandId);
      const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

      const otp = generateOtp();
      // Prepare complaint object
      const complaintData = {
         ...body,
         userId: user._id,
         userName: user.name,
         issueImages: req.file?.location,
         // assignServiceCenterId: serviceCenter?._id,
         // assignServiceCenter: serviceCenter?.serviceCenterName,
         // serviceCenterContact: serviceCenter?.contact,
         // assignServiceCenterTime: new Date(),
         // status: serviceCenter ? 'ASSIGN' : 'PENDING',
         createEmpName: createEmpName1,
         otp: otp
      };

      const complaint = new ComplaintModal(complaintData);
      await complaint.save();

      // Prepare and send SMS
      const preferredDate = complaint.preferredServiceDate
         ? moment(complaint.preferredServiceDate)
         : moment().add(1, 'days'); // Tomorrow's date if not present

      const preferredTime = complaint.preferredServiceTime || '09:00'; // Default time if not present

      const visitTime = moment(
         `${preferredDate.format('YYYY-MM-DD')}T${preferredTime}`
      ).format('hh:mm A on MMMM D, YYYY');

      const smsVars = smsTemplates.COMPLAINT_REGISTERED.buildVars({
         fullName,
         complaintId: complaint.complaintId || complaint._id.toString(),
         issueType: complaint?.detailedDescription,
         serviceCenterName: 'Service Center visit your location',
         visitTime: visitTime, // Dynamically set your visit time here
         phoneNumber: phoneNumber,
         otp: complaint.otp || Math.floor(100000 + Math.random() * 900000).toString(), // Save this OTP in DB if used
         complaintId: complaint.complaintId || complaint._id.toString(),
         helpline: '7777883885' // Change to your helpline
      });



      // 2. Log smsVars to confirm correctness
      // console.log('smsVars:', smsVars);

      // console.log("phoneNumber", phoneNumber);

      await sendBlessTemplateSms(phoneNumber, smsTemplates.COMPLAINT_REGISTERED.id, smsVars);

      // Create notification
      const notification = new NotificationModel({
         complaintId: complaint._id,
         userId: user._id,
         brandId: complaint.brandId,
         serviceCenterId: serviceCenter?._id,
         dealerId: complaint.dealerId,
         userName: fullName,
         title: 'Complaint',
         message: `Registered Your Complaint, ${fullName}!`,
      });
      await notification.save();

      return res.json({ status: true, msg: 'Complaint Added', user });
   } catch (err) {
      console.error('Error in addComplaint:', err);
      return res.status(500).json({ status: false, msg: 'Internal Server Error', error: err.message });
   }
};


//   const complaintData = {
//       ...req.body,
//       issueImages,
//       issueVideo: issueVideoUrl,
//     };



const createComplaintWithVideo = async (req, res) => {
   try {


      const body = req.body;
      const {
         city,
         pincode,
         emailAddress,
         fullName,
         phoneNumber,
         serviceAddress,
         brandId,
         uniqueId,
         district,
         createEmpName,
         state,
      } = body;

      const email = emailAddress;
      const productName = body?.productName;
      const productId = body?.productId;
      const createEmpName1 = createEmpName || fullName;


      //  console.log("Files received:", req.files);
      //  console.log("req.files.issueImages?.[0]?.location", req.files.issueImages?.[0]?.location);

      // ✅ S3 image
      // const issueImages = req.file?.location ||req.files?.issueImages[0]?.s3Location || null;
      const issueImages =
         req.file?.location || // if single file (multer-s3 single)
         (req.files?.issueImages && req.files.issueImages.length > 0
            ? req.files.issueImages[0].s3Location
            : null);


      // ✅ Google Drive video
      let issueVideoUrl = null;
      const videoFile = req.files.issueVideo?.[0];
      //  console.log("issueImages",issueImages);
      //  console.log("req.files.issueImages?.[0]?.location",req.files.issueImages?.[0]?.location);
      //  console.log("req.file?.location",req.file?.location);
      //  console.log("videoFile",videoFile);

      if (videoFile) {
         const bufferStream = new stream.PassThrough();
         bufferStream.end(videoFile.buffer);

         const uploadResponse = await drive.files.create({
            requestBody: {
               name: videoFile.originalname,
               mimeType: videoFile.mimetype,
               parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
            },
            media: { mimeType: videoFile.mimetype, body: bufferStream },
            fields: "id",
         });

         await drive.permissions.create({
            fileId: uploadResponse.data.id,
            requestBody: { role: "reader", type: "anyone" },
         });

         issueVideoUrl = `https://drive.google.com/uc?id=${uploadResponse.data.id}`;
      }

      const user = await findOrCreateUser(email, fullName, phoneNumber, serviceAddress);

      // Handle warranty lookup and update
      if (uniqueId) {
         const success = await handleWarrantyUpdate(uniqueId, productName, productId, fullName, email, phoneNumber, serviceAddress, district, state, pincode);
         if (!success) {
            return res.status(404).json({ status: false, msg: 'Warranty record not found' });
         }
      }

      // Find service center
      const serviceCenter = await findServiceCenter(pincode, brandId);
      const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

      const otp = generateOtp();
      // Prepare complaint object
      const complaintData = {
         ...body,
         userId: user._id,
         userName: user.name,
         // issueImages: req.file?.location,
         issueImages,
         issueVideo: issueVideoUrl,
         // assignServiceCenterId: serviceCenter?._id,
         // assignServiceCenter: serviceCenter?.serviceCenterName,
         // serviceCenterContact: serviceCenter?.contact,
         // assignServiceCenterTime: new Date(),
         // status: serviceCenter ? 'ASSIGN' : 'PENDING',
         createEmpName: createEmpName1,
         otp: otp
      };

      const complaint = new ComplaintModal(complaintData);
      await complaint.save();

      // Prepare and send SMS
      const preferredDate = complaint.preferredServiceDate
         ? moment(complaint.preferredServiceDate)
         : moment().add(1, 'days'); // Tomorrow's date if not present

      const preferredTime = complaint.preferredServiceTime || '09:00'; // Default time if not present

      const visitTime = moment(
         `${preferredDate.format('YYYY-MM-DD')}T${preferredTime}`
      ).format('hh:mm A on MMMM D, YYYY');

      const smsVars = smsTemplates.COMPLAINT_REGISTERED.buildVars({
         fullName,
         complaintId: complaint.complaintId || complaint._id.toString(),
         issueType: complaint?.detailedDescription,
         serviceCenterName: 'Service Center visit your location',
         visitTime: visitTime, // Dynamically set your visit time here
         phoneNumber: phoneNumber,
         otp: complaint.otp || Math.floor(100000 + Math.random() * 900000).toString(), // Save this OTP in DB if used
         complaintId: complaint.complaintId || complaint._id.toString(),
         helpline: '7777883885' // Change to your helpline
      });



      // 2. Log smsVars to confirm correctness
      // console.log('smsVars:', smsVars);

      // console.log("phoneNumber", phoneNumber);

      await sendBlessTemplateSms(phoneNumber, smsTemplates.COMPLAINT_REGISTERED.id, smsVars);

      // Create notification
      const notification = new NotificationModel({
         complaintId: complaint._id,
         userId: user._id,
         brandId: complaint.brandId,
         serviceCenterId: serviceCenter?._id,
         dealerId: complaint.dealerId,
         userName: fullName,
         title: 'Complaint',
         message: `Registered Your Complaint, ${fullName}!`,
      });
      await notification.save();

      return res.json({ status: true, msg: 'Complaint Added', user });



   } catch (err) {
      console.error(err);
      res.status(500).json({ status: false, message: err.message });
   }
};


const findOrCreateUser = async (email, name, contact, address) => {
   let user = await UserModel.findOne({ contact });
   if (!user) {
      user = new UserModel({
         email,
         name,
         contact,
         address,
         password: '12345678', // Default password (make this secure in production)
      });
      await user.save();
   }
   return user;
};

const handleWarrantyUpdate = async (uniqueId, productName, productId, fullName, email, contact, address, district, state, pincode) => {
   try {
      console.time('Update Warranty');

      const result = await ProductWarrantyModal.updateOne(
         { 'records.uniqueId': uniqueId },
         {
            $set: {
               productName: productName,
               productId: productId,
               'records.$.productName': productName,
               'records.$.productId': productId,
               'records.$.isActivated': true,
               'records.$.userName': fullName,
               'records.$.email': email,
               'records.$.contact': contact,
               'records.$.address': address,
               'records.$.district': district,
               'records.$.state': state,
               'records.$.pincode': pincode,
               'records.$.activationDate': new Date()
            }
         }
      );

      console.log('Update result', result);
      console.timeEnd('Update Warranty');
      // Emit socket only if updated successfully

      // const io = req.app.get('socketio');

      //     if (result.modifiedCount > 0 && io) {
      //       const payload = {

      //           uniqueId,
      //           productName,
      //           productId,
      //           fullName,
      //           email,
      //           contact,
      //           address,
      //           district,
      //           state,
      //           pincode,
      //           activationDate: new Date(),

      //         message: `Warranty activated for ${productName} by ${fullName}`
      //       };

      //       // console.log("📢 Emitting warrantyUpdated:", payload);
      //       io.emit('warrantyActivated', payload);
      //     }


      // Check if the update matched and modified a document
      return result.modifiedCount > 0;
   } catch (err) {
      console.error('Error updating warranty:', err);
      return false;
   }
};


const findServiceCenter = async (pincode, brandId) => {
   if (!pincode || !brandId) return null;
   return await ServiceModel.findOne({
      $and: [
         {
            $or: [
               { postalCode: pincode },
               { pincodeSupported: { $in: [pincode] } },
            ],
         },
         { brandsSupported: { $in: [brandId] } },
      ],
   });
};





const addAPPComplaint = async (req, res) => {
   try {
      // let body = req.body;
      // let obj = { ...body, issueImages: req.file.location };
      // console.log(obj);
      let body = req.body;


      let { city, pincode, brandId } = body; // Extract city and pincode from request body

      // Find a service center based on city or pincode
      let serviceCenter;
      if (pincode) {
         // serviceCenter = await ServiceModel.findOne({
         //    $or: [
         //       { postalCode: pincode },
         //       { pincodeSupported: { $in: [pincode] } }
         //    ]

         // });
         // serviceCenter = await ServiceModel.findOne({
         //    $or: [
         //      { postalCode: pincode },
         //      { pincodeSupported: { $in: [pincode] } }
         //    ],
         //    brandsSupported: { $in: [brandId] }
         //  });
         serviceCenter = await ServiceModel.findOne({
            $and: [
               {
                  $or: [
                     { postalCode: pincode },
                     { pincodeSupported: { $in: [pincode] } }
                  ]
               },
               { brandsSupported: { $in: [brandId] } }
            ]
         });

      }
      // else if (city) {
      //    serviceCenter = await ServiceModel.findOne({ city: city });
      // }
      // let serviceCenter;
      // if (pincode) {
      //     serviceCenter = await ServiceModel.findOne({
      //         $or: [
      //             { postalCode: pincode },
      //             { pincodeSupported: { $in: [pincode] } }
      //         ],
      //         "brandsSupported.value": req?.body?.brandId // Matching inside array of objects
      //     });
      // } else if (city) {
      //     serviceCenter = await ServiceModel.findOne({
      //         city: city,
      //         "brandsSupported.value": req?.body?.brandId
      //     });
      // }


      if (!serviceCenter) {
         let obj = {
            ...body,

            assignServiceCenterId: serviceCenter?._id,
            assignServiceCenter: serviceCenter?.serviceCenterName,
            serviceCenterContact: serviceCenter?.contact,
            // assignServiceCenterTime: new Date()
         };
         if (serviceCenter) {
            obj.status = "ASSIGN";
         }
         let data = new ComplaintModal(obj);
         await data.save();
         const notification = new NotificationModel({
            complaintId: data?._id,
            userId: data.userId,
            brandId: data.brandId,
            serviceCenterId: serviceCenter?._id,
            dealerId: data.dealerId,
            userName: data.fullName,
            title: `User Complaint`,
            message: `Registred Your Complaint, ${req.body.fullName}!`,
         });
         await notification.save();

         return res.json({ status: true, msg: "Complaint Added" });
      }
      let obj = {
         ...body,
         // issueImages: req.file ? req.file.location : "", 
         // warrantyImage: req.file ? req.file.location : "", 
         assignServiceCenterId: serviceCenter?._id,
         assignServiceCenter: serviceCenter?.serviceCenterName,
         serviceCenterContact: serviceCenter?.contact,
         assignServiceCenterTime: new Date()
      };
      if (serviceCenter) {
         obj.status = "ASSIGN";
      }
      let data = new ComplaintModal(obj);
      await data.save();


      const notification = new NotificationModel({
         complaintId: data._id,
         userId: data.userId,
         brandId: data.brandId,
         serviceCenterId: serviceCenter?._id,
         dealerId: data.dealerId,
         userName: data.fullName,
         title: `  Complaint`,
         message: `Registered Your Complaint, ${req.body.fullName}!`,
      });
      await notification.save();
      res.json({ status: true, msg: "Complaint Added" });

   } catch (err) {
      console.error('Error in  :', err);
      res.status(400).send(err);
   }

};
// const addDealerComplaint = async (req, res) => {
//    try {
//       let body = req.body;
//       let warrantyImage = req.file ? req.file.location : "";
//       let issueImages = req.file ? req.file.location : "";
//       let obj = { ...body, issueImages, warrantyImage };

//       let data = new ComplaintModal(obj);
//       await data.save();
//       const notification = new NotificationModel({
//          complaintId: data?._id,
//          userId: data.userId,
//          brandId: data.brandId,
//          dealerId: data.dealerId,
//          userName: data.fullName,
//          title: `Dealer Complaint`,
//          message: `Registred Your Complaint, ${req.body.fullName}!`,
//       });
//       await notification.save();
//       res.json({ status: true, msg: "Complaint   Added" });
//    } catch (err) {
//       res.status(400).send(err);
//    }

// };

const addDealerComplaint = async (req, res) => {
   try {
      let body = req.body;


      let { city, pincode, brandId } = body; // Extract city and pincode from request body

      // Find a service center based on city or pincode
      let serviceCenter;
      if (pincode) {
         // serviceCenter = await ServiceModel.findOne({ postalCode: pincode });
         serviceCenter = await ServiceModel.findOne({
            $and: [
               {
                  $or: [
                     { postalCode: pincode },
                     { pincodeSupported: { $in: [pincode] } }
                  ]
               },
               { brandsSupported: { $in: [brandId] } }
            ]
         });
      }

      console.log("serviceCenter", serviceCenter);

      // else if (city) {
      //    serviceCenter = await ServiceModel.findOne({ city: city });
      // }
      // console.log(serviceCenter);

      if (!serviceCenter) {
         let obj = {
            ...body,
            issueImages: req.file ? req.file.location : "",
            warrantyImage: req.file ? req.file.location : "",
            assignServiceCenterId: serviceCenter?._id,
            assignServiceCenter: serviceCenter?.serviceCenterName,
            serviceCenterContact: serviceCenter?.contact,
            // assignServiceCenterTime: new Date()
         };
         let data = new ComplaintModal(obj);

         await data.save();


         const notification = new NotificationModel({
            complaintId: data._id,
            userId: data.userId,
            brandId: data.brandId,
            serviceCenterId: serviceCenter?._id,
            dealerId: data.dealerId,
            userName: data.fullName,
            title: `  Complaint`,
            message: `Registered Your Complaint, ${req.body.fullName}!`,
         });
         await notification.save();
         return res.json({ status: true, msg: "Complaint Added" });
         // return res.status(404).json({ status: false, msg: 'No service center found for the provided city or pincode.' });
      }

      let obj = {
         ...body,
         issueImages: req.file ? req.file.location : "",
         warrantyImage: req.file ? req.file.location : "",
         assignServiceCenterId: serviceCenter?._id,
         assignServiceCenter: serviceCenter?.serviceCenterName,
         serviceCenterContact: serviceCenter?.contact,
         assignServiceCenterTime: new Date()
      };
      let data = new ComplaintModal(obj);
      await data.save();


      const notification = new NotificationModel({
         complaintId: data._id,
         userId: data.userId,
         brandId: data.brandId,
         serviceCenterId: serviceCenter?._id,
         dealerId: data.dealerId,
         userName: data.fullName,
         title: `  Complaint`,
         message: `Registered Your Complaint, ${req.body.fullName}!`,
      });
      await notification.save();
      res.json({ status: true, msg: "Complaint Added" });
   } catch (err) {
      console.error(err);
      res.status(400).send(err);
   }
};

const editIssueImage = async (req, res) => {
   try {
      let _id = req.params.id;
      let obj = await ComplaintModal.findById(_id);
      obj.images = req.file.location;

      let obj1 = await ComplaintModal.findByIdAndUpdate(_id, { issueImages: obj.images }, { new: true });
      res.json({ status: true, msg: "Update Image", data: obj1 });
   } catch (err) {
      res.status(500).send(err);
   }
};




// const getAllBrandComplaint = async (req, res) => {
//    try {
//       let data = await ComplaintModal.find({}).sort({ _id: -1 });
//       res.send(data)
//    }
//    catch (err) {
//       res.status(400).send(err);
//    }
// }
const getAllBrandComplaint = async (req, res) => {
   try {
      // Step 1: Get active brand IDs (lean for performance)
      const activeBrandIds = await BrandRegistrationModel
         .find({ status: "ACTIVE" })
         .lean()
         .select("_id");

      // Step 2: Extract just the ObjectId values
      const brandIds = activeBrandIds.map(brand => brand._id);

      // Step 3: Get complaints for those brands (lean for performance)
      const complaints = await ComplaintModal
         .find({ brandId: { $in: brandIds } })
         .sort({ _id: -1 })
         .lean();

      // Step 4: Send response
      res.status(200).json(complaints);
   } catch (err) {
      res.status(500).json({ error: err.message });
   }
};

// const getAllComplaint = async (req, res) => {
//    try {
//      const page = parseInt(req.query.page) || 1;
//      const limit = 400; // Fixed limit of 200 complaints
//      const skip = (page - 1) * limit;

//      // Get the total count of complaints
//      const totalComplaints = await ComplaintModal.countDocuments();

//      // Fetch 200 complaints with pagination
//      const complaints = await ComplaintModal.find({})
//        .sort({ _id: -1 })
//        .skip(skip)
//        .limit(limit)
//        .lean(); // Improve performance by returning plain JS objects

//      // Send response with complaints and total count
//      res.status(200).json({
//        success: true,
//        total: totalComplaints,
//        page,
//        limit,
//        data: complaints,
//      });
//    } catch (err) {
//      console.error("Error fetching complaints:", err);
//      res.status(500).json({
//        success: false,
//        message: "Internal Server Error",
//        error: err.message,
//      });
//    }
//  };

const getAllComplaint1 = async (req, res) => {
   try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;

      // Get the total count of documents
      const totalComplaints = await ComplaintModal.countDocuments();

      // Fetch the data with pagination
      let data = await ComplaintModal.find({})
         .sort({ _id: -1 })
         .skip(skip)
         .limit(limit);

      // Send response with data and total count
      res.send({ data, totalComplaints });
   } catch (err) {
      res.status(400).send(err);
   }
};



const getAllComplaint = async (req, res) => {
   try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;

      // Step 1: Get all ACTIVE brand IDs
      const activeBrandIds = await BrandRegistrationModel
         .find({ status: "ACTIVE" }, { _id: 1 })
         .lean()
         .then(brands => brands.map(b => b._id));

      // Step 2: Query complaints with active brandId + pagination
      const [complaints, total] = await Promise.all([
         ComplaintModal.find({ brandId: { $in: activeBrandIds } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),

         ComplaintModal.countDocuments({ brandId: { $in: activeBrandIds } })
      ]);

      res.status(200).json({
         data: complaints,
         totalComplaints: total,
         currentPage: page,
         totalPages: Math.ceil(total / limit)
      });
   } catch (err) {
      console.error("Error in getAllComplaint:", err);
      res.status(500).json({ error: "Internal server error" });
   }
};






// const getAllComplaintByRole = async (req, res) => {
//    try {
//       const page = parseInt(req.query.page) || 1;
//       const limit = parseInt(req.query.limit) || 10;
//       const skip = (page - 1) * limit;

//       // Extract filters from query params
//       const { brandId, serviceCenterId, technicianId, userId, dealerId } = req.query;

//       // Build the filter object
//       let filterConditions = {};

//       if (brandId) filterConditions.brandId = brandId;
//       if (serviceCenterId) filterConditions.assignServiceCenterId = serviceCenterId;
//       if (technicianId) filterConditions.technicianId = technicianId;
//       if (userId) filterConditions.userId = userId; // Assuming userId represents the customer
//       if (dealerId) filterConditions.userId = dealerId; // Assuming userId represents the dealer

//       // Get the total count of documents that match the filters
//       const totalComplaints = await ComplaintModal.countDocuments(filterConditions);

//       // Fetch the data with pagination and filters
//       const data = await ComplaintModal.find(filterConditions)
//          .sort({ _id: -1 }) // Sorting by newest complaints
//          .skip(skip)
//          .limit(limit);

//       // Send response with filtered data and total count
//       res.send({ data, totalComplaints });
//    } catch (err) {
//       console.error("Error fetching complaints:", err);
//       res.status(500).send({ message: "Internal server error" });
//    }
// };


const getAllComplaintByRole = async (req, res) => {
   try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Destructure filters and role info
      const {
         brandId,
         serviceCenterId,
         technicianId,
         userId,
         dealerId,
         role,
         employeeId // for EMPLOYEE role
      } = req.query;

      let filterConditions = {};

      if (employeeId) {
         if (!employeeId) {
            return res.status(400).json({ message: "employeeId is required for EMPLOYEE role" });
         }

         // Fetch employee details
         const employee = await EmployeeModel.findById(employeeId).lean();
         if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
         }

         // Extract brand IDs (handle array of {label, value} objects)
         const brandIds = Array.isArray(employee.brand)
            ? employee.brand.map(b => (typeof b === 'object' && b.value ? b.value : b))
            : [];

         // Extract stateZones (array of strings)
         const stateZones = Array.isArray(employee.stateZone) ? employee.stateZone.filter(Boolean) : [];

         // Apply filters only if employee has those values
         if (brandIds.length > 0) {
            filterConditions.brandId = { $in: brandIds };
         }

         if (stateZones.length > 0) {
            filterConditions.state = { $in: stateZones };
         }

      } else {
         // Normal role filters
         if (brandId) filterConditions.brandId = brandId;
         if (serviceCenterId) filterConditions.assignServiceCenterId = serviceCenterId;
         if (technicianId) filterConditions.technicianId = technicianId;
         if (userId) filterConditions.userId = userId;
         if (dealerId) filterConditions.userId = dealerId;
      }

      // Count total documents matching filter
      const totalComplaints = await ComplaintModal.countDocuments(filterConditions);

      // Fetch data with pagination
      const data = await ComplaintModal.find(filterConditions)
         .sort({ _id: -1 })
         .skip(skip)
         .limit(limit)
         .lean();

      res.status(200).json({ data, totalComplaints });

   } catch (error) {
      console.error("Error fetching complaints:", error);
      res.status(500).json({ message: "Internal server error" });
   }
};


const getComplaintById = async (req, res) => {
   try {
      let _id = req.params.id;
      let data = await ComplaintModal.findById(_id);
      res.send(data);
   } catch (err) {
      res.status(400).send(err);
   }
}
const getComplaintByUserId = async (req, res) => {

   try {
      const userId = req.params.id;  // Ensure you are using req.params.id

      const complaints = await ComplaintModal.find({ userId })
         .populate('userId');
      if (!complaints.length) {
         return res.status(404).json({ message: "No complaints found for this Service Center ID" });
      }

      res.send(complaints);
   } catch (err) {
      console.error("Error fetching complaints:", err);
      res.status(500).json({ error: "Server error", details: err.message });
   }
};

const getComplaintByUniqueId = async (req, res) => {

   try {
      const uniqueId = req.params.id;  // Ensure you are using req.params.id


      const complaints = await ComplaintModal.find({ uniqueId })
         .populate('uniqueId');
      if (!complaints.length) {
         return res.status(404).json({ message: "No complaints found for this unique ID" });
      }

      res.send(complaints);
   } catch (err) {
      console.error("Error fetching complaints:", err);
      res.status(500).json({ error: "Server error", details: err.message });
   }
};

const getComplaintByTechId = async (req, res) => {

   try {
      const technicianId = req.params.id;  // Ensure you are using req.params.id

      const complaints = await ComplaintModal.find({ technicianId })
         .populate('technicianId');
      if (!complaints.length) {
         return res.status(404).json({ message: "No complaints found for this Service Center ID" });
      }

      res.send(complaints);
   } catch (err) {
      console.error("Error fetching complaints:", err);
      res.status(500).json({ error: "Server error", details: err.message });
   }
};
const getComplaintBydealerId = async (req, res) => {

   try {
      const dealerId = req.params.id;  // Ensure you are using req.params.id

      const complaints = await ComplaintModal.find({ dealerId })
         .populate('dealerId');
      if (!complaints.length) {
         return res.status(404).json({ message: "No complaints found for this Service Center ID" });
      }

      res.send(complaints);
   } catch (err) {
      console.error("Error fetching complaints:", err);
      res.status(500).json({ error: "Server error", details: err.message });
   }
};
const getComplaintByCenterId = async (req, res) => {
   try {
      const assignServiceCenterId = req.params.id;  // Ensure you are using req.params.id

      const complaints = await ComplaintModal.find({ assignServiceCenterId })
         .populate('assignServiceCenterId');
      if (!complaints.length) {
         return res.status(404).json({ message: "No complaints found for this Service Center ID" });
      }

      res.send(complaints);
   } catch (err) {
      console.error("Error fetching complaints:", err);
      res.status(500).json({ error: "Server error", details: err.message });
   }
};


const getCompleteComplaintByUserContact = async (req, res) => {
   try {


      const { phoneNumber } = req.query; // or req.body or req.params based on your route setup
      //  console.log("req.query",req.body);
      //  console.log("phoneNumber",req.query);
      // console.log("phoneNumber", phoneNumber);
      if (!phoneNumber) {
         return res.status(400).send({ status: false, msg: "Phone number is required." });
      }

      // Step 1: Get active brand IDs
      const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" })
         .select("_id")
         .lean();
      const activeBrandIds = activeBrands.map(b => b._id.toString());

      // Step 2: Fetch complaints matching phone number and "ASSIGN" status
      const complaints = await ComplaintModal.find({
         phoneNumber: phoneNumber // assuming exact match
      }).sort({ _id: -1 });

      // Step 3: Filter complaints to only include those with active brands
      const filteredComplaints = complaints.filter(c =>
         activeBrandIds.includes(c.brandId?.toString())
      );

      if (filteredComplaints.length === 0) {
         return res.status(404).send({ status: false, msg: "No assigned complaints found for this contact." });
      }

      res.send(filteredComplaints);
   } catch (err) {
      res.status(400).send({ status: false, error: err.message });
   }
};



const getComplaintsByPending = async (req, res) => {
   try {
      // let data = await ComplaintModal.find({ status: "PENDING" }).sort({ _id: -1 }); // Find all complaints with status "PENDING"
      const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" })
         .select("_id")
         .lean();
      const activeBrandIds = activeBrands.map(b => b._id.toString()); // toString() for safe comparison

      // Step 2: Fetch all complaints
      const complaints = await ComplaintModal.find({ status: "PENDING" }).sort({ _id: -1 });

      // Step 3: Filter complaints with active brandId
      const filteredComplaints = complaints.filter(c =>
         activeBrandIds.includes(c.brandId?.toString())
      );
      let data = filteredComplaints;
      if (data.length === 0) {
         return res.status(404).send({ status: false, msg: "No pending complaints found." });
      }
      res.send(data);
   } catch (err) {
      res.status(400).send(err);
   }
};
const getComplaintsByHighPriorityPending = async (req, res) => {
   try {
      // let data = await ComplaintModal.find({ status: "PENDING" }).sort({ _id: -1 }); // Find all complaints with status "PENDING"
      const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" })
         .select("_id")
         .lean();
      const activeBrandIds = activeBrands.map(b => b._id.toString()); // toString() for safe comparison

      // Step 2: Fetch all complaints
      const complaints = await ComplaintModal.find({ status: { $in: ["PENDING", "IN PROGRESS", "PART PENDING", "ASSIGN", "CUSTOMER SIDE PENDING"] } }).sort({ _id: -1 });

      // Step 3: Filter complaints with active brandId
      const filteredComplaints = complaints.filter(c =>
         activeBrandIds.includes(c.brandId?.toString())
      );
      let data = filteredComplaints;
      if (data.length === 0) {
         return res.status(404).send({ status: false, msg: "No pending complaints found." });
      }
      res.send(data);
   } catch (err) {
      res.status(400).send(err);
   }
};
const getComplaintsByAssign = async (req, res) => {
   try {
      // let data = await ComplaintModal.find({ status: "ASSIGN" }).sort({ _id: -1 }); // Find all complaints with status "PENDING"

      const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" })
         .select("_id")
         .lean();
      const activeBrandIds = activeBrands.map(b => b._id.toString()); // toString() for safe comparison

      // Step 2: Fetch all complaints
      const complaints = await ComplaintModal.find({ status: "ASSIGN" }).sort({ _id: -1 });

      // Step 3: Filter complaints with active brandId
      const filteredComplaints = complaints.filter(c =>
         activeBrandIds.includes(c.brandId?.toString())
      );
      let data = filteredComplaints;
      if (data.length === 0) {
         return res.status(404).send({ status: false, msg: "No pending complaints found." });
      }
      res.send(data);
   } catch (err) {
      res.status(400).send(err);
   }
};

const getComplaintsByInProgress = async (req, res) => {
   try {
      // let data = await ComplaintModal.find({ status: "IN PROGRESS" }).sort({ _id: -1 }); // Find all complaints with status "PENDING"
      const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" })
         .select("_id")
         .lean();
      const activeBrandIds = activeBrands.map(b => b._id.toString()); // toString() for safe comparison

      // Step 2: Fetch all complaints
      const complaints = await ComplaintModal.find({ status: "IN PROGRESS" }).sort({ _id: -1 });

      // Step 3: Filter complaints with active brandId
      const filteredComplaints = complaints.filter(c =>
         activeBrandIds.includes(c.brandId?.toString())
      );
      let data = filteredComplaints;
      if (data.length === 0) {
         return res.status(404).send({ status: false, msg: "No pending complaints found." });
      }
      res.send(data);
   } catch (err) {
      res.status(400).send(err);
   }
};


// const getComplaintsByComplete = async (req, res) => {
//    try {
//       // let data = await ComplaintModal.find({ status: "COMPLETED" }).sort({ _id: -1 }); // Find all complaints with status "PENDING"
//       //   const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }, );
//       const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" })
//          .select("_id")
//          .lean();
//       const activeBrandIds = activeBrands.map(b => b._id.toString()); // toString() for safe comparison

//       // Step 2: Fetch all complaints
//       const complaints = await ComplaintModal.find({ status: "COMPLETED" }).sort({ _id: -1 });

//       // Step 3: Filter complaints with active brandId
//       const filteredComplaints = complaints.filter(c =>
//          activeBrandIds.includes(c.brandId?.toString())
//       );
//       let data = filteredComplaints;
//       if (data.length === 0) {
//          return res.status(404).send({ status: false, msg: "No pending complaints found." });
//       }
//       res.send(data);
//    } catch (err) {
//       res.status(400).send(err);
//    }
// };


const getComplaintsByComplete = async (req, res) => {

   try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;

      // Step 1: Get all ACTIVE brand IDs
      const activeBrandIds = await BrandRegistrationModel
         .find({ status: "ACTIVE" }, { _id: 1 })
         .lean()
         .then(brands => brands.map(b => b._id));



      // Step 3: Build the complaint query
      const complaintQuery = {
         brandId: { $in: activeBrandIds },
         status: "COMPLETED"
      };

      // Step 4: Fetch complaints and total count
      const [complaints, total] = await Promise.all([
         ComplaintModal.find(complaintQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
         ComplaintModal.countDocuments(complaintQuery)
      ]);

      // Step 5: Return response
      res.status(200).json({
         data: complaints,
         totalComplaints: total,
         currentPage: page,
         totalPages: Math.ceil(total / limit)
      });
   } catch (err) {
      console.error("Error in getAllComplaint:", err);
      res.status(500).json({ error: "Internal server error" });
   }
};

// const getCompleteComplaintByRole = async (req, res) => {
//    try {
//       const page = parseInt(req.query.page) || 1;
//       const limit = parseInt(req.query.limit) || 10;
//       const skip = (page - 1) * limit;

//       const { brandId, serviceCenterId, technicianId, userId, dealerId } = req.query;

//       // Always include only COMPLETED complaints
//       let filterConditions = { status: "COMPLETED" };

//       if (brandId) filterConditions.brandId = brandId;
//       if (serviceCenterId) filterConditions.assignServiceCenterId = serviceCenterId;
//       if (technicianId) filterConditions.technicianId = technicianId;
//       if (userId) filterConditions.userId = userId;
//       if (dealerId) filterConditions.userId = dealerId; // This will override `userId` if both are present

//       // Get count
//       const totalComplaints = await ComplaintModal.countDocuments(filterConditions);

//       // Get paginated data
//       const data = await ComplaintModal.find(filterConditions)
//          .sort({ _id: -1 })
//          .skip(skip)
//          .limit(limit)
//          .lean(); // lean() for performance

//       res.status(200).send({ data, totalComplaints });
//    } catch (err) {
//       console.error("Error fetching complaints:", err);
//       res.status(500).send({ message: "Internal server error" });
//    }
// };




const getCompleteComplaintByRole = async (req, res) => {
   try {
      // Pagination params
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const {
         brandId,
         serviceCenterId,
         technicianId,
         userId,
         dealerId,
         role,
         employeeId
      } = req.query;

      let filterConditions = { status: "COMPLETED" };

      if (employeeId) {
         if (!employeeId) {
            return res.status(400).json({ message: "employeeId required for EMPLOYEE role" });
         }

         // Fetch employee details
         const employee = await EmployeeModel.findById(employeeId).lean();
         if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
         }

         // Extract brand IDs (array of brand _id strings)
         const brandIds = Array.isArray(employee.brand)
            ? employee.brand.map(b => b.value)
            : [];

         // Extract state zones
         const stateZones = Array.isArray(employee.stateZone) ? employee.stateZone : [];

         // Apply brand filter if brands exist
         if (brandIds.length > 0) {
            filterConditions.brandId = { $in: brandIds };
         }

         // Apply state filter if states exist
         if (stateZones.length > 0) {
            filterConditions.state = { $in: stateZones };
         }
      } else {
         // Other roles filtering
         if (brandId) filterConditions.brandId = brandId;
         if (serviceCenterId) filterConditions.assignServiceCenterId = serviceCenterId;
         if (technicianId) filterConditions.technicianId = technicianId;
         if (userId) filterConditions.userId = userId;
         if (dealerId) filterConditions.userId = dealerId;
      }

      // Count total complaints
      const totalComplaints = await ComplaintModal.countDocuments(filterConditions);

      // Fetch complaints paginated
      const data = await ComplaintModal.find(filterConditions)
         .sort({ _id: -1 })
         .skip(skip)
         .limit(limit)
         .lean();

      res.status(200).json({ data, totalComplaints });
   } catch (error) {
      console.error("Error fetching complaints:", error);
      res.status(500).json({ message: "Internal server error" });
   }
};



const getComplaintsByCancel = async (req, res) => {
   try {
      // let data = await ComplaintModal.find({ status: "CANCELED" }).sort({ _id: -1 }); // Find all complaints with status "PENDING"
      const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" })
         .select("_id")
         .lean();
      const activeBrandIds = activeBrands.map(b => b._id.toString()); // toString() for safe comparison

      // Step 2: Fetch all complaints
      const complaints = await ComplaintModal.find({ status: "CANCELED" }).sort({ _id: -1 });

      // Step 3: Filter complaints with active brandId
      const filteredComplaints = complaints.filter(c =>
         activeBrandIds.includes(c.brandId?.toString())
      );
      let data = filteredComplaints;
      if (data.length === 0) {
         return res.status(404).send({ status: false, msg: "No pending complaints found." });
      }
      res.send(data);
   } catch (err) {
      res.status(400).send(err);
   }
};

// getComplaintsByUpcomming
const getComplaintsByUpcomming = async (req, res) => {
   try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999); // End of today

      // Find complaints where preferredServiceDate is strictly in the future
      let complaints = await ComplaintModal.find({
         preferredServiceDate: { $gt: endOfToday }, // Future complaints only (not today)
         status: { $nin: ["COMPLETED", "FINAL VERIFICATION", "CANCELED"] }// Exclude unwanted statuses
      }).sort({ preferredServiceDate: 1 });
      const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" })
         .select("_id")
         .lean();
      const activeBrandIds = activeBrands.map(b => b._id.toString()); // toString() for safe comparison



      // Step 3: Filter complaints with active brandId
      const filteredComplaints = complaints.filter(c =>
         activeBrandIds.includes(c.brandId?.toString())
      );
      let data = filteredComplaints;
      if (data.length === 0) {
         return res.status(404).json({ status: false, msg: "No upcoming complaints found." });
      }

      res.send(data);
   } catch (err) {
      console.error("Error fetching upcoming complaints:", err);
      res.status(500).json({ status: false, msg: "Server error", error: err });
   }
};






const getComplaintsByFinalVerification = async (req, res) => {
   try {
      // let data = await ComplaintModal.find({ status: "FINAL VERIFICATION" }).sort({ _id: -1 }); // Find all complaints with status "PENDING"

      const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" })
         .select("_id")
         .lean();
      const activeBrandIds = activeBrands.map(b => b._id.toString()); // toString() for safe comparison

      // Step 2: Fetch all complaints
      const complaints = await ComplaintModal.find({ status: "FINAL VERIFICATION" }).sort({ _id: -1 });

      // Step 3: Filter complaints with active brandId
      const filteredComplaints = complaints.filter(c =>
         activeBrandIds.includes(c.brandId?.toString())
      );
      let data = filteredComplaints;
      if (data.length === 0) {
         return res.status(404).send({ status: false, msg: "No pending complaints found." });
      }
      res.send(data);
   } catch (err) {
      res.status(400).send(err);
   }
};
const getComplaintsByPartPending = async (req, res) => {
   try {
      // let data = await ComplaintModal.find({ status: "PART PENDING" }).sort({ _id: -1 }); // Find all complaints with status "PENDING"

      const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" })
         .select("_id")
         .lean();
      const activeBrandIds = activeBrands.map(b => b._id.toString()); // toString() for safe comparison

      // Step 2: Fetch all complaints
      const complaints = await ComplaintModal.find({ status: "PART PENDING" }).sort({ _id: -1 });

      // Step 3: Filter complaints with active brandId
      const filteredComplaints = complaints.filter(c =>
         activeBrandIds.includes(c.brandId?.toString())
      );
      let data = filteredComplaints;
      if (data.length === 0) {
         return res.status(404).send({ status: false, msg: "No pending complaints found." });
      }
      res.send(data);
   } catch (err) {
      res.status(400).send(err);
   }
};


const getComplaintsByCustomerSidePending = async (req, res) => {
   try {
      // let data = await ComplaintModal.find({ status: "CUSTOMER SIDE PENDING" }).sort({ _id: -1 }); // Find all complaints with status "PENDING"

      const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" })
         .select("_id")
         .lean();
      const activeBrandIds = activeBrands.map(b => b._id.toString()); // toString() for safe comparison

      // Step 2: Fetch all complaints
      const complaints = await ComplaintModal.find({ status: "CUSTOMER SIDE PENDING" }).sort({ _id: -1 });

      // Step 3: Filter complaints with active brandId
      const filteredComplaints = complaints.filter(c =>
         activeBrandIds.includes(c.brandId?.toString())
      );
      let data = filteredComplaints;
      if (data.length === 0) {
         return res.status(404).send({ status: false, msg: "No pending complaints found." });
      }
      res.send(data);
   } catch (err) {
      res.status(400).send(err);
   }
};

const getTodayCreatedComplaints = async (req, res) => {
   try {
      const { date } = req.query;

      if (!date) {
         return res.status(400).send({ status: false, msg: "Date query parameter is required." });
      }

      // Parse the date string to Date object for start and end of day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" })
         .select("_id")
         .lean();

      const activeBrandIds = activeBrands.map((b) => b._id.toString());

      const data = await ComplaintModal.find({
         createdAt: { $gte: startOfDay, $lte: endOfDay },
         brandId: { $in: activeBrandIds }
      }).sort({ _id: -1 });

      if (data.length === 0) {
         return res.status(404).send({ status: false, msg: "No complaints created on this date." });
      }

      res.send(data);
   } catch (err) {
      res.status(400).send(err);
   }
};




// const getTodayCompletedComplaints = async (req, res) => {
//    try {
//       // Define today's date range
//       const startOfDay = new Date();
//       startOfDay.setHours(0, 0, 0, 0);

//       const endOfDay = new Date();
//       endOfDay.setHours(23, 59, 59, 999);


//       const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" })
//          .select("_id")
//          .lean();
//       const activeBrandIds = activeBrands.map((b) => b._id.toString());
//       // Query for complaints with status "COMPLETED" or "FINAL VERIFICATION" updated today
//       const data = await ComplaintModal.find({
//          status: { $in: ["COMPLETED", "FINAL VERIFICATION"] },
//          brandId: { $in: activeBrandIds },
//          updatedAt: { $gte: startOfDay, $lte: endOfDay }
//       }).sort({ _id: -1 });

//       if (data.length === 0) {
//          return res.status(404).send({ status: false, msg: "No completed or final verification complaints found for today." });
//       }

//       res.send(data);
//    } catch (err) {
//       res.status(400).send(err);
//    }
// };


const getTodayCompletedComplaints = async (req, res) => {
   try {
      let { date } = req.query;

      // Use provided date or default to today's date
      const baseDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(baseDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(baseDate.setHours(23, 59, 59, 999));

      const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" })
         .select("_id")
         .lean();

      const activeBrandIds = activeBrands.map((b) => b._id.toString());

      const data = await ComplaintModal.find({
         status: { $in: ["COMPLETED", "FINAL VERIFICATION"] },
         brandId: { $in: activeBrandIds },
         updatedAt: { $gte: startOfDay, $lte: endOfDay },
      }).sort({ _id: -1 });

      if (data.length === 0) {
         return res.status(404).send({
            status: false,
            msg: "No completed or final verification complaints found for the selected date.",
         });
      }

      res.send(data);
   } catch (err) {
      res.status(400).send(err);
   }
};


// const getPendingComplaints = async (req, res) => {
//    try {
//      const { days } = req.params; // Get days filter from params
//      let startDate, endDate;
//      const currentDate = new Date();

//    //   console.log("Received days:", days);

//      if (days === "0-1") {
//        startDate = new Date();
//        startDate.setDate(currentDate.getDate() - 1);
//        startDate.setHours(0, 0, 0, 0);

//        endDate = new Date();
//        endDate.setHours(23, 59, 59, 999);
//      } else if (days === "2-5") {
//        startDate = new Date();
//        startDate.setDate(currentDate.getDate() - 5);
//        startDate.setHours(0, 0, 0, 0);

//        endDate = new Date();
//        endDate.setDate(currentDate.getDate() - 2);
//        endDate.setHours(23, 59, 59, 999);
//      } else if (days === "more-than-week") {
//        endDate = new Date();
//        endDate.setDate(currentDate.getDate() - 6);
//        endDate.setHours(23, 59, 59, 999);
//      }

//    //   console.log("Start Date:", startDate);
//    //   console.log("End Date:", endDate);

//      let filter = { status: "PENDING" };

//      if (days === "0-1" || days === "2-5") {
//        filter.createdAt = { $gte: startDate, $lte: endDate };
//      } else if (days === "more-than-week") {
//        filter.createdAt = { $lte: endDate }; // Fetch complaints **older** than 7 days
//      }

//    //   console.log("Filter Query:", JSON.stringify(filter, null, 2));

//      const complaints = await ComplaintModal.find(filter).sort({ createdAt: -1 });

//    //   console.log("Found complaints:", complaints.length);

//      res.status(200).json({ success: true, data: complaints });
//    } catch (error) {
//      console.error("Error fetching pending complaints:", error);
//      res.status(500).json({ success: false, message: "Server error" });
//    }
//  };

const getPendingComplaints = async (req, res) => {
   try {
      const { days } = req.params; // Get days filter from params
      const now = new Date();
      let startDate, endDate;

      if (days === "0-1") {
         startDate = new Date(now);
         startDate.setDate(now.getDate() - 1);
         startDate.setHours(0, 0, 0, 0);

         endDate = new Date(now);
         endDate.setHours(23, 59, 59, 999);
      } else if (days === "2-5") {
         startDate = new Date(now);
         startDate.setDate(now.getDate() - 5);
         startDate.setHours(23, 59, 59, 999);

         endDate = new Date(now);
         endDate.setDate(now.getDate() - 2);
         endDate.setHours(23, 59, 59, 999);
      } else if (days === "more-than-week") {
         endDate = new Date(now);
         endDate.setDate(now.getDate() - 5); // Ensure correct range
         endDate.setHours(23, 59, 59, 999);
      }
      const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" })
         .select("_id")
         .lean();

      const activeBrandIds = activeBrands.map((b) => b._id.toString());

      let filter = {
         status: { $nin: ["COMPLETED", "FINAL VERIFICATION", "CANCELED"] },
         brandId: { $in: activeBrandIds }
      };

      if (days === "0-1" || days === "2-5") {
         filter.createdAt = { $gte: startDate, $lte: endDate };
      } else if (days === "more-than-week") {
         filter.createdAt = { $lte: endDate };
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 2);

      const complaintsForToday = await ComplaintModal.find({
         $or: [

            {
               preferredServiceDate: { $lt: today },
               status: { $nin: ["COMPLETED", "FINAL VERIFICATION", "CANCELED"] },
               brandId: { $in: activeBrandIds }
            } // Past but not completed
         ]
      }).sort({ preferredServiceDate: 1 });
      const complaints = await ComplaintModal.find(filter).sort({ createdAt: -1 });

      res.status(200).json({ success: true, data: complaints, scheduleToday: complaintsForToday });
   } catch (error) {
      console.error("Error fetching pending complaints:", error);
      res.status(500).json({ success: false, message: "Server error" });
   }
};

const getPartPendingComplaints = async (req, res) => {
   try {
      const { days } = req.params; // Get days filter from params
      const now = new Date();
      let startDate, endDate;

      if (days === "0-1") {
         startDate = new Date(now);
         startDate.setDate(now.getDate() - 1);
         startDate.setHours(0, 0, 0, 0);

         endDate = new Date(now);
         endDate.setHours(23, 59, 59, 999);
      } else if (days === "2-5") {
         startDate = new Date(now);
         startDate.setDate(now.getDate() - 5);
         startDate.setHours(23, 59, 59, 999);

         endDate = new Date(now);
         endDate.setDate(now.getDate() - 2);
         endDate.setHours(23, 59, 59, 999);
      } else if (days === "more-than-week") {
         endDate = new Date(now);
         endDate.setDate(now.getDate() - 5); // Ensure correct range
         endDate.setHours(23, 59, 59, 999);
      }
      const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" })
         .select("_id")
         .lean();
      const activeBrandIds = activeBrands.map((b) => b._id.toString());
      let filter = { status: "PART PENDING", brandId: { $in: activeBrandIds } };


      if (days === "0-1" || days === "2-5") {
         filter.createdAt = { $gte: startDate, $lte: endDate };
      } else if (days === "more-than-week") {
         filter.createdAt = { $lte: endDate };
      }

      const complaints = await ComplaintModal.find(filter).sort({ createdAt: -1 });

      res.status(200).json({ success: true, data: complaints });
   } catch (error) {
      console.error("Error fetching pending complaints:", error);
      res.status(500).json({ success: false, message: "Server error" });
   }
};


// const editComplaint = async (req, res) => {
//    try {
//       let _id = req.params.id;
//       let body = req.body;

//       let data = await ComplaintModal.findByIdAndUpdate(_id, body);
//       if (body.assignServiceCenterId) {
//          const notification = new NotificationModel({
//             complaintId: data?._id,
//             userId: data.userId,
//             technicianId: body.technicianId,
//             serviceCenterId: body.assignServiceCenterId,
//             brandId: data.brandId,
//             dealerId: data.dealerId,
//             userName: data.productBrand,
//             title: `Brand Assign Service Center  `,
//             message: `Assign Service Center on Your Complaint !`,
//          });
//          await notification.save();
//       }
//       if (body.technicianId) {
//          const notification = new NotificationModel({
//             complaintId: data?._id,
//             userId: data.userId,
//             technicianId: body.technicianId,
//             serviceCenterId: body.assignServiceCenterId,
//             brandId: data.brandId,
//             dealerId: data.dealerId,
//             userName: data.assignServiceCenter,
//             title: ` Service Center Assign Technician  `,
//             message: `Assign Technician on  Your Complaint !`,
//          });
//          await notification.save();
//       }
//       res.json({ status: true, msg: "Complaint Updated" });
//    } catch (err) {
//       res.status(500).send(err);
//    }
// }

const editComplaint = async (req, res) => {
   try {
      let _id = req.params.id;
      let body = req.body;

      // Prepare the changes to be logged in updateHistory
      const changes = {};
      for (const key in body) {
         if (body.hasOwnProperty(key) && key !== 'updateHistory') {
            changes[key] = body[key];
         }
      }

      // Find the complaint and update it
      let data = await ComplaintModal.findById(_id);
      if (!data) {
         return res.status(404).json({ status: false, msg: "Complaint not found" });
      }
      if (!data.empResponseTime && body.empResponseTime) {
         data.empResponseTime = new Date(); // Set only if it was never set before
      }

      // Push the update details into updateHistory
      data.updateHistory.push({
         updatedAt: new Date(),
         changes: changes,
      });
      // Push the update details into updateHistory
      // data.updateHistory.push({
      //    updatedAt: new Date(),
      //    changes: changes,
      // });

      // Update the complaint with new data
      // Object.assign(data, body);
      // await data.save();
      if (body.status === "PART PENDING") {
         data.cspStatus = "YES";
      }
      if (body.status === "CUSTOMER SIDE PENDING") {
         data.cspStatus = "YES";
      }
      if (body.status === "FINAL VERIFICATION") {
         data.complaintCloseTime = new Date();

      }
      if (body.status === "COMPLETED") {
         data.complaintCloseTime = new Date();

      }
      if (!data.complaintCloseTime && body.complaintCloseTime) {
         data.complaintCloseTime = new Date(); // Set only if it was never set before
      }


      let dataComp = await ComplaintModal.findById(_id);


      const oldStatus = dataComp.status;

      // Apply updates to the complaint object
      Object.assign(data, body);

      // Save the updated complaint
      await data.save();


      // Save original value before applying any changes


      // Check if status has changed before emitting socket event
      // if (body.status && body.status !== oldStatus) {
      //    const io = req.app.get('socketio');

      //    const payload = {
      //       complaintId: data._id,
      //       complaintNumber: data.complaintId,
      //       status: data.status,
      //       brandId: data.brandId,
      //       assignedTo: {
      //          serviceCenterId: data.assignServiceCenterId,
      //       },
      //       fullName: data.fullName,
      //       phoneNumber: data.phoneNumber,
      //       productBrand: data.productBrand,
      //       productName: data.productName,
      //       updatedAt: new Date(),
      //       contact: data.contact || data.phoneNumber,
      //       pincode: data.pincode,
      //       assignServiceCenter: data.assignServiceCenter,
      //       district: data.district,
      //       state: data.state,
      //       message: `Complaint ${data.complaintId} status updated from ${oldStatus} to ${data.status}`,
      //    };

      //    if (io) {
      //       // console.log("📢 Emitting complaintStatusUpdated:", payload);
      //       io.emit('complaintStatusUpdated', payload);
      //    } else {
      //       console.warn("⚠️ Socket.IO instance not found on app object");
      //    }
      // }




      if (body.assignServiceCenterId) {
         if (body.status === "ASSIGN") {

            await sendNotification(
               body.assignServiceCenterId,
               ` Assign  Complaint `,
               `You have been assigned a new complaint (ID: ${data?.complaintId}). Please review the details and take the necessary action.`
            );
         }
         const notification = new NotificationModel({
            complaintId: data._id,
            compId: data.complaintId,
            userId: data.userId,
            technicianId: body.technicianId,
            serviceCenterId: body.assignServiceCenterId,
            brandId: data.brandId,
            dealerId: data.dealerId,
            userName: data.productBrand,
            title: `Brand Assign Service Center`,
            message: `Assign Service Center on Your Complaint!`,
         });
         await notification.save();
      }
      if (body.technicianId) {
         const notification = new NotificationModel({
            complaintId: data._id,
            compId: data.complaintId,
            userId: data.userId,
            technicianId: body.technicianId,
            serviceCenterId: body.assignServiceCenterId,
            brandId: data.brandId,
            dealerId: data.dealerId,
            userName: data.assignServiceCenter,
            title: `Service Center Assign Technician`,
            message: `Assign Technician on Your Complaint!`,
         });
         await notification.save();
      }
      if (body.status === "COMPLETED") {
         // let subCatData = await SubCategoryModal.findById({categoryId:data.categoryId});
         let subCatData = await SubCategoryModal.findOne({ categoryId: data.categoryId });

         const brandTrans = new BrandRechargeModel({
            brandId: data.brandId,
            brandName: data.productBrand,
            amount: -body?.paymentBrand,
            complaintId: data._id,
            description: "Complaint Close  Payout"
         });
         await brandTrans.save();
         // if (subCatData) {

         //    const serviceCenterWallet = await WalletModel.findOne({ serviceCenterId: data.assignServiceCenterId }).exec();

         //    if (!serviceCenterWallet) {
         //       // Handle case where wallet is not found
         //       console.error('Wallet not found for service center:',);
         //       // return;
         //       return res.json({ status: true, msg: "Complaint Updated" });
         //    }

         //    serviceCenterWallet.totalCommission = (parseInt(serviceCenterWallet.totalCommission || 0) + parseInt(subCatData.payout));
         //    serviceCenterWallet.dueAmount = (parseInt(serviceCenterWallet.dueAmount || 0) + parseInt(subCatData.payout));
         //    // await serviceCenterWallet.save();


         //    const dealerWallet = await WalletModel.findOne({ serviceCenterId: data.dealerId }).exec();

         //    if (!dealerWallet) {
         //       // Handle case where wallet is not found
         //       console.error('Wallet not found for dealer:',);
         //       return res.json({ status: true, msg: "Complaint Updated" });
         //    }

         //    const payout = parseInt(subCatData.payout);

         //    // If dealerId is present, add 20% of payout, else add full payout
         //    const commissionToAdd = data.dealerId ? payout * 0.2 : payout;

         //    // Update service center's total commission and due amount
         //    dealerWallet.totalCommission = (parseInt(dealerWallet.totalCommission || 0) + commissionToAdd);
         //    dealerWallet.dueAmount = (parseInt(dealerWallet.dueAmount || 0) + commissionToAdd);

         //    await dealerWallet.save();
         // }

      }
      res.json({ status: true, msg: "Complaint Updated" });
   } catch (err) {
      res.status(500).send(err);
   }
};


const sendNotification = async (serviceCenterId, title, body) => {
   try {
      // Fetch the service center's token from the database
      const serviceCenter = await ServiceModel.findById(serviceCenterId);
      if (!serviceCenter || !serviceCenter.fcmToken) {
         console.error("Service center or token not found");
         return;
      }

      // Send the notification using the retrieved token
      await admin.messaging().send({
         token: serviceCenter.fcmToken,
         notification: {
            title: title,
            body: body,
         },
      });

      console.log("Notification sent successfully to", serviceCenterId);
   } catch (error) {
      console.error("Notification failed", error);
   }
};


const updatePartPendingImage = async (req, res) => {
   try {
      let _id = req.params.id;
      let body = req.body;
      let image = req.file ? req.file.location || req.file.path : null;

      console.log("Image:", image);
      console.log("Body:", body);

      // Find the complaint
      let data = await ComplaintModal.findById(_id);
      if (!data) {
         return res.status(404).json({ status: false, msg: "Complaint not found" });
      }

      // Initialize updateHistory if not present
      data.updateHistory = data.updateHistory || [];

      // Update fields conditionally
      if (!data.empResponseTime && body.empResponseTime) {
         data.empResponseTime = new Date();
      }

      if (image) {
         data.partPendingImage = image;
      }

      // data.updateHistory.push({
      //    updatedAt: new Date(),
      //    changes: { ...body },
      // });
      const sanitizedChanges = { ...body };

      // Sanitize serviceCenterId
      if (Array.isArray(sanitizedChanges.serviceCenterId)) {
         sanitizedChanges.serviceCenterId = sanitizedChanges.serviceCenterId[0]; // or join(',') if multiple values make sense
      }

      data.updateHistory.push({
         updatedAt: new Date(),
         changes: sanitizedChanges,
      });


      // Handle status updates
      if (body.status === "PART PENDING") {
         data.cspStatus = "YES";
      }
      if (body.status === "CUSTOMER SIDE PENDING") {
         data.cspStatus = "YES";
      }
      if (["FINAL VERIFICATION", "COMPLETED"].includes(body.status)) {
         data.complaintCloseTime = new Date();
      }

      if (!data.complaintCloseTime && body.complaintCloseTime) {
         data.complaintCloseTime = new Date();
      }

      // Apply updates
      Object.assign(data, body);
      await data.save();

      // Send notifications
      if (body.assignServiceCenterId) {
         await new NotificationModel({
            complaintId: data._id,
            compId: data.complaintId,
            userId: data.userId,
            technicianId: body.technicianId,
            serviceCenterId: body.assignServiceCenterId,
            brandId: data.brandId,
            dealerId: data.dealerId,
            userName: data.productBrand,
            title: `Brand Assign Service Center`,
            message: `Assign Service Center on Your Complaint!`,
         }).save();
      }

      if (body.technicianId) {
         await new NotificationModel({
            complaintId: data._id,
            compId: data.complaintId,
            userId: data.userId,
            technicianId: body.technicianId,
            serviceCenterId: body.assignServiceCenterId,
            brandId: data.brandId,
            dealerId: data.dealerId,
            userName: data.assignServiceCenter,
            title: `Service Center Assign Technician`,
            message: `Assign Technician on Your Complaint!`,
         }).save();
      }
      if (body.status === "FINAL VERIFICATION") {
         data.complaintCloseTime = new Date();

         let spareParts = body.spareParts;

         if (typeof spareParts === "string") {
            try {
               spareParts = JSON.parse(spareParts);
            } catch (error) {
               spareParts = []; // fallback to empty array
            }
         }

         if (Array.isArray(spareParts) && spareParts.length > 0) {
            const chalanImage = req.file ? req.file.location || req.file.path : null;

            const newOrder = new OrderModel({
               spareParts,
               brandId: body.brandId || data.brandId,
               brandName: body.brandName || data.productBrand,
               serviceCenterId: body.serviceCenterId || data.assignServiceCenterId,
               serviceCenter: body.serviceCenter || data.assignServiceCenter,
               brandApproval: "APPROVED"

            });
            console.log("newOrder", newOrder);

            await newOrder.save();
         }

         // Continue with the rest of your complaint update logic...
      }


      // Wallet & Payout handling
      if (body.status === "COMPLETED") {
         let subCatData = await SubCategoryModal.findOne({ categoryId: data.categoryId });

         if (subCatData) {
            await new BrandRechargeModel({
               brandId: data.brandId,
               brandName: data.productBrand,
               amount: -body?.paymentBrand,
               complaintId: data._id,
               description: "Complaint Close Payout"
            }).save();

            const serviceCenterWallet = await WalletModel.findOne({ serviceCenterId: data.assignServiceCenterId });
            if (serviceCenterWallet) {
               serviceCenterWallet.totalCommission = (parseInt(serviceCenterWallet.totalCommission || 0) + parseInt(subCatData.payout));
               serviceCenterWallet.dueAmount = (parseInt(serviceCenterWallet.dueAmount || 0) + parseInt(subCatData.payout));
               // await serviceCenterWallet.save();
            } else {
               console.error('Wallet not found for service center:', data.assignServiceCenterId);
               return res.json({ status: true, msg: "Complaint Updated" });
            }

            const dealerWallet = await WalletModel.findOne({ serviceCenterId: data.dealerId });
            if (dealerWallet) {
               const payout = parseInt(subCatData.payout);
               const commissionToAdd = data.dealerId ? payout * 0.2 : payout;

               dealerWallet.totalCommission = (parseInt(dealerWallet.totalCommission || 0) + commissionToAdd);
               dealerWallet.dueAmount = (parseInt(dealerWallet.dueAmount || 0) + commissionToAdd);
               await dealerWallet.save();
            } else {
               console.error('Wallet not found for dealer:', data.dealerId);
               return res.json({ status: true, msg: "Complaint Updated" });
            }
         }
      }

      res.json({ status: true, msg: "Complaint Updated" });
   } catch (err) {
      console.error("Error updating complaint:", err);
      res.status(500).json({ status: false, msg: "Server Error", error: err.message });
   }
};

const updateMultiImageImage = async (req, res) => {
   try {
      let _id = req.params.id;
      let body = req.body;

      // Handle multiple images
      const goodsImage = req.files?.goodsImage
         ? req.files.goodsImage[0].location || req.files.goodsImage[0].path
         : null;

      const defectivePartImage = req.files?.defectivePartImage
         ? req.files.defectivePartImage[0].location || req.files.defectivePartImage[0].path
         : null;

      // console.log("Part Pending Image:", goodsImage);
      // console.log("Defective Part Image:", defectivePartImage);
      // console.log("Body:", body);

      // Find complaint
      let data = await ComplaintModal.findById(_id);
      if (!data) {
         return res.status(404).json({ status: false, msg: "Complaint not found" });
      }

      // Initialize history
      data.updateHistory = data.updateHistory || [];

      // Response time
      if (!data.empResponseTime && body.empResponseTime) {
         data.empResponseTime = new Date();
      }

      // Update images
      if (goodsImage) data.goodsImage = goodsImage;
      if (defectivePartImage) data.defectivePartImage = defectivePartImage;

      // Sanitize body
      const sanitizedChanges = { ...body };
      if (Array.isArray(sanitizedChanges.serviceCenterId)) {
         sanitizedChanges.serviceCenterId = sanitizedChanges.serviceCenterId[0];
      }

      // Push history
      data.updateHistory.push({
         updatedAt: new Date(),
         changes: sanitizedChanges,
      });

      // Status handling
      if (["PART PENDING", "CUSTOMER SIDE PENDING"].includes(body.status)) {
         data.cspStatus = "YES";
      }

      if (["FINAL VERIFICATION", "COMPLETED"].includes(body.status)) {
         data.complaintCloseTime = new Date();
      }

      if (!data.complaintCloseTime && body.complaintCloseTime) {
         data.complaintCloseTime = new Date();
      }

      // Merge updates
      Object.assign(data, body);
      await data.save();

      // Send notifications
      if (body.assignServiceCenterId) {
         await new NotificationModel({
            complaintId: data._id,
            compId: data.complaintId,
            userId: data.userId,
            technicianId: body.technicianId,
            serviceCenterId: body.assignServiceCenterId,
            brandId: data.brandId,
            dealerId: data.dealerId,
            userName: data.productBrand,
            title: `Brand Assign Service Center`,
            message: `Assign Service Center on Your Complaint!`,
         }).save();
      }

      if (body.technicianId) {
         await new NotificationModel({
            complaintId: data._id,
            compId: data.complaintId,
            userId: data.userId,
            technicianId: body.technicianId,
            serviceCenterId: body.assignServiceCenterId,
            brandId: data.brandId,
            dealerId: data.dealerId,
            userName: data.assignServiceCenter,
            title: `Service Center Assign Technician`,
            message: `Assign Technician on Your Complaint!`,
         }).save();
      }
      if (body.status === "FINAL VERIFICATION") {
         data.complaintCloseTime = new Date();

         let spareParts = body.spareParts;

         if (typeof spareParts === "string") {
            try {
               spareParts = JSON.parse(spareParts);
            } catch (error) {
               spareParts = []; // fallback to empty array
            }
         }

         if (Array.isArray(spareParts) && spareParts.length > 0) {
            const chalanImage = req.file ? req.file.location || req.file.path : null;

            const newOrder = new OrderModel({
               spareParts,
               brandId: body.brandId || data.brandId,
               brandName: body.brandName || data.productBrand,
               serviceCenterId: body.serviceCenterId || data.assignServiceCenterId,
               serviceCenter: body.serviceCenter || data.assignServiceCenter,
               brandApproval: "APPROVED"

            });
            console.log("newOrder", newOrder);

            await newOrder.save();
         }

         // Continue with the rest of your complaint update logic...
      }


      // Wallet & Payout handling
      if (body.status === "COMPLETED") {
         let subCatData = await SubCategoryModal.findOne({ categoryId: data.categoryId });

         if (subCatData) {
            await new BrandRechargeModel({
               brandId: data.brandId,
               brandName: data.productBrand,
               amount: -body?.paymentBrand,
               complaintId: data._id,
               description: "Complaint Close Payout"
            }).save();

            const serviceCenterWallet = await WalletModel.findOne({ serviceCenterId: data.assignServiceCenterId });
            if (serviceCenterWallet) {
               serviceCenterWallet.totalCommission = (parseInt(serviceCenterWallet.totalCommission || 0) + parseInt(subCatData.payout));
               serviceCenterWallet.dueAmount = (parseInt(serviceCenterWallet.dueAmount || 0) + parseInt(subCatData.payout));
               // await serviceCenterWallet.save();
            } else {
               console.error('Wallet not found for service center:', data.assignServiceCenterId);
               return res.json({ status: true, msg: "Complaint Updated" });
            }

            const dealerWallet = await WalletModel.findOne({ serviceCenterId: data.dealerId });
            if (dealerWallet) {
               const payout = parseInt(subCatData.payout);
               const commissionToAdd = data.dealerId ? payout * 0.2 : payout;

               dealerWallet.totalCommission = (parseInt(dealerWallet.totalCommission || 0) + commissionToAdd);
               dealerWallet.dueAmount = (parseInt(dealerWallet.dueAmount || 0) + commissionToAdd);
               await dealerWallet.save();
            } else {
               console.error('Wallet not found for dealer:', data.dealerId);
               return res.json({ status: true, msg: "Complaint Updated" });
            }
         }
      }

      res.json({ status: true, msg: "Complaint Updated" });
   } catch (err) {
      console.error("Error updating complaint:", err);
      res.status(500).json({ status: false, msg: "Server Error", error: err.message });
   }
};


// const updateMultiImageImage = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const partPendingImage = req.files["partPendingImage"]
//       ? req.files["partPendingImage"][0].location // if using S3
//       : null;

//     const defectivePartImage = req.files["defectivePartImage"]
//       ? req.files["defectivePartImage"][0].location
//       : null;

//     // Now update your DB
//     const updatedComplaint = await Complaint.findByIdAndUpdate(
//       id,
//       {
//         ...(partPendingImage && { partPendingImage }),
//         ...(defectivePartImage && { defectivePartImage }),
//       },
//       { new: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: "Complaint updated successfully",
//       data: updatedComplaint,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };


const updateFinalVerification = async (req, res) => {
   try {
      let _id = req.params.id;
      let body = req.body;
      let image = req.file ? req.file.location : null;

      // console.log("Received Image:", image);
      // console.log("Complaint ID:", _id);
      // console.log("Request Body:", body);

      // Validate ID
      if (!_id) {
         return res.status(400).json({ status: false, msg: "Invalid ID" });
      }

      // Find the complaint
      let data = await ComplaintModal.findById(_id);
      // console.log("data ID:", data);
      if (!data) {
         return res.status(404).json({ status: false, msg: "Complaint not found" });
      }

      // Prepare update object
      let updateFields = { ...body };
      if (image) {
         updateFields.partImage = image;
      }

      // Append update history
      const changes = { ...updateFields };
      delete changes.updateHistory;

      data.updateHistory.push({
         updatedAt: new Date(),
         changes,
      });

      // Update document safely
      Object.assign(data, updateFields);
      // await data.save();

      // Handle notifications
      if (body.assignServiceCenterId) {
         await NotificationModel.create({
            complaintId: data._id,
            compId: data.complaintId,
            userId: data.userId,
            technicianId: body.technicianId,
            serviceCenterId: body.assignServiceCenterId,
            brandId: data.brandId,
            dealerId: data.dealerId,
            userName: data.productBrand,
            title: "Brand Assign Service Center",
            message: "Assign Service Center on Your Complaint!",
         });
      }

      if (body.technicianId) {
         await NotificationModel.create({
            complaintId: data._id,
            compId: data.complaintId,
            userId: data.userId,
            technicianId: body.technicianId,
            serviceCenterId: body.assignServiceCenterId,
            brandId: data.brandId,
            dealerId: data.dealerId,
            userName: data.assignServiceCenter,
            title: "Service Center Assign Technician",
            message: "Assign Technician on Your Complaint!",
         });
      }

      // Handle completed complaint logic
      if (body.status === "COMPLETED") {
         let subCatData = await SubCategoryModal.findOne({ _id: data.subCategoryId });
         // **Update paymentServiceCenter**

         // Brand transaction
         await BrandRechargeModel.create({
            brandId: data.brandId,
            brandName: data.productBrand,
            amount: -(body?.paymentBrand) || 0,
            complaintId: data._id,
            description: "Complaint Close Payout",
         });

         let payout = 0; // Ensure payout is always defined

         // if (subCatData) {
         //    payout = parseInt(subCatData.payout || 0);
         //    data.paymentServiceCenter = payout || 0;

         //    if (isNaN(payout) || payout <= 0) {
         //       console.error("Invalid payout amount:", subCatData.payout);
         //       return res.json({ status: true, msg: "Complaint Updated with invalid payout" });
         //    }
         //    const serviceCenter = await ServiceModel.findOne({ _id: data.assignServiceCenterId });

         //    let existingPayment = await ServicePaymentModel.findOne({
         //       serviceCenterId: data.assignServiceCenterId,
         //       complaintId: data._id,
         //    });

         //    if (!existingPayment) {

         //       // if (serviceCenter) {
         //       //    await ServicePaymentModel.create({
         //       //       serviceCenterId: data.assignServiceCenterId,
         //       //       serviceCenterName: data.assignServiceCenter,
         //       //       payment: payout.toString(),
         //       //       description: "Service Center Payment for Completed Complaint",
         //       //       contactNo: serviceCenter.contact,
         //       //       complaintId: data._id,
         //       //       city: serviceCenter.city,
         //       //       address: serviceCenter.streetAddress,
         //       //       status: "UNPAID",
         //       //    });
         //       // }
         //    } else {
         //       console.log("Service payment already exists for complaint:", data._id);
         //    }
         //    // Service Center Wallet Update
         //    let serviceCenterWallet = await WalletModel.findOne({ serviceCenterId: data?.assignServiceCenterId });
         //    if (serviceCenterWallet) {
         //       serviceCenterWallet.totalCommission += payout;
         //       serviceCenterWallet.dueAmount += payout;
         //       // await serviceCenterWallet.save();
         //    } else {
         //       console.warn("No wallet found for service center:", data.assignServiceCenterId);
         //    }

         //    // Dealer Wallet Update
         //    let dealerWallet = await WalletModel.findOne({ dealerId: data.dealerId });
         //    if (dealerWallet) {
         //       let commissionToAdd = data.dealerId ? payout * 0.2 : payout;
         //       dealerWallet.totalCommission += commissionToAdd;
         //       dealerWallet.dueAmount += commissionToAdd;
         //       await dealerWallet.save();
         //    } else {
         //       console.warn("No wallet found for dealer:", data.dealerId);
         //    }
         // }

         // else {

         //    let paymentServiceCenter = parseFloat(body?.paymentServiceCenter) || 0;
         //    const serviceCenter = await ServiceModel.findOne({ _id: data.assignServiceCenterId });

         //    let existingPayment = await ServicePaymentModel.findOne({
         //       serviceCenterId: data.assignServiceCenterId,
         //       complaintId: data._id,
         //    });

         //    if (!existingPayment) {

         //       if (serviceCenter) {
         //          await ServicePaymentModel.create({
         //             serviceCenterId: data.assignServiceCenterId,
         //             serviceCenterName: data.assignServiceCenter,
         //             payment: paymentServiceCenter.toString(),
         //             description: "Service Center Payment for Completed Complaint",
         //             contactNo: serviceCenter.contact,
         //             complaintId: data._id,
         //             city: serviceCenter.city,
         //             address: serviceCenter.streetAddress,
         //             status: "UNPAID",
         //          });
         //       }
         //    } else {
         //       console.log("Service payment already exists for complaint:", data._id);
         //    }
         //    let serviceCenterWallet = await WalletModel.findOne({ serviceCenterId: data.assignServiceCenterId });

         //    if (serviceCenterWallet) {
         //       serviceCenterWallet.totalCommission += paymentServiceCenter;
         //       serviceCenterWallet.dueAmount += paymentServiceCenter;

         //       // await serviceCenterWallet.save();
         //    } else {
         //       console.warn("No wallet found for service center:", data.assignServiceCenterId);
         //    }
         // }


         await data.save();


      }
      await data.save(); // Save complaint after updating `paymentServiceCenter`
      res.json({ status: true, msg: "Complaint Updated" });
   } catch (err) {
      console.error("Error updating complaint:", err);
      res.status(500).json({ status: false, msg: "Internal Server Error", error: err.message });
   }
};






const updateComplaintComments = async (req, res) => {
   try {
      const _id = req.params.id;
      const body = req.body;

      // Prepare the changes to be logged in updateComments
      const changes = {};
      for (const key in body) {
         if (body.hasOwnProperty(key) && key !== 'updateComments') {
            changes[key] = body[key];
         }
      }

      // Find the complaint by ID
      const complaint = await ComplaintModal.findById(_id);
      if (!complaint) {
         return res.status(404).json({ status: false, msg: "Complaint not found" });
      }

      // Push the update details into updateComments
      complaint.updateComments.push({
         updatedAt: new Date(),
         changes: changes,
      });

      // Update the complaint fields
      Object.assign(complaint, body);

      // Save the updated complaint
      await complaint.save();

      res.json({ status: true, msg: "Complaint Updated" });
   } catch (err) {
      res.status(500).send({ status: false, msg: "Error updating complaint", error: err.message });
   }
};

const deleteComplaint = async (req, res) => {
   try {
      let _id = req.params.id;
      let data = await ComplaintModal.findByIdAndDelete(_id);
      res.json({ status: true, msg: "Complaint Deteled" });
   } catch (err) {
      res.status(500).send(err);
   }
}

const updateComplaint = async (req, res) => {
   try {
      let _id = req.params.id;
      let body = req.body;
      let data = await ComplaintModal.findByIdAndUpdate(_id, body);
      res.json({ status: true, msg: "Complaint Updated" });
   } catch (err) {
      res.status(500).send(err);
   }
}

module.exports = {
   addComplaint, createComplaintWithVideo, addDealerComplaint, getComplaintByUniqueId, getComplaintsByAssign, getComplaintsByCancel, getComplaintsByComplete
   , getComplaintsByInProgress, getComplaintsByUpcomming, getComplaintsByCustomerSidePending, getComplaintsByPartPending, getCompleteComplaintByUserContact, getComplaintsByHighPriorityPending, getComplaintsByPending, getComplaintsByFinalVerification,
   getPendingComplaints, getTodayCompletedComplaints, getTodayCreatedComplaints, getPartPendingComplaints, addAPPComplaint, getAllBrandComplaint, getCompleteComplaintByRole, getAllComplaintByRole, getAllComplaint, getComplaintByUserId, getComplaintByTechId, getComplaintBydealerId, getComplaintByCenterId, getComplaintById, updateComplaintComments, editIssueImage, updateFinalVerification, updateMultiImageImage, updatePartPendingImage, editComplaint, deleteComplaint, updateComplaint
};
