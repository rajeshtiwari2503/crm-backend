const ComplaintModal = require("../models/complaint")
const NotificationModel = require("../models/notification")
const { ServiceModel } = require("../models/registration")
const { UserModel,BrandRegistrationModel } = require("../models/registration")
const SubCategoryModal = require("../models/subCategory")
const BrandRechargeModel = require("../models/brandRecharge")
const WalletModel = require("../models/wallet")
const ProductWarrantyModal = require("../models/productWarranty")
const OneSignal = require('onesignal-node');
const ServicePaymentModel = require("../models/servicePaymentModel")
const fetch = require("node-fetch");


const { admin } = require('../firebase/index')


// const addComplaint = async (req, res) => {
//    try {
//       let body = req.body;
//       let { city, pincode } = body; // Extract city and pincode from request body

//       // Find a service center based on city or pincode
//       let serviceCenter;
//       if (pincode) {
//          // serviceCenter = await ServiceModel.findOne({ postalCode: pincode });
//          serviceCenter = await ServiceModel.findOne({
//             $or: [
//                { postalCode: pincode },
//                { pincodeSupported: { $in: [pincode] } }
//             ]
//          });
//       }
//        else if (city) {
//          serviceCenter = await ServiceModel.findOne({ city: city });
//       }
//       // console.log(serviceCenter);

//       if (!serviceCenter) {
//          let obj = {
//             ...body,
//             issueImages: req.file?.location,
//             assignServiceCenterId: serviceCenter?._id,
//             assignServiceCenter: serviceCenter?.serviceCenterName,
//             assignServiceCenterTime: new Date()
//          };
//          let data = new ComplaintModal(obj);
//          await data.save();


//          const notification = new NotificationModel({
//             complaintId: data._id,
//             userId: data.userId,
//             brandId: data.brandId,
//             serviceCenterId: serviceCenter?._id,
//             dealerId: data.dealerId,
//             userName: data.fullName,
//             title: `  Complaint`,
//             message: `Registered Your Complaint, ${req.body.fullName}!`,
//          });
//          await notification.save();
//          return res.json({ status: true, msg: "Complaint Added" });
//          // return res.status(404).json({ status: false, msg: 'No service center found for the provided city or pincode.' });
//       }

//       let obj = {
//          ...body,
//          issueImages: req.file?.location,
//          assignServiceCenterId: serviceCenter?._id,
//          assignServiceCenter: serviceCenter?.serviceCenterName,
//          assignServiceCenterTime: new Date()
//       };
//       let data = new ComplaintModal(obj);
//       await data.save();


//       const notification = new NotificationModel({
//          complaintId: data._id,
//          userId: data.userId,
//          brandId: data.brandId,
//          serviceCenterId: serviceCenter?._id,
//          dealerId: data.dealerId,
//          userName: data.fullName,
//          title: `  Complaint`,
//          message: `Registered Your Complaint, ${req.body.fullName}!`,
//       });
//       await notification.save();
//       res.json({ status: true, msg: "Complaint Added" });
//    } catch (err) {
//       console.error(err);
//       res.status(400).send(err);
//    }
// };

const twilio = require("twilio");

const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendWhatsAppMessage = async (fullName, phoneNumber, _id) => {
   const formattedPhoneNumber = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+91${phoneNumber}`;

   console.log("Formatted phoneNumber:", formattedPhoneNumber);

   const messageBody = `Hello ${fullName}, your complaint has been successfully registered. Our service center will contact you shortly.
      
      Complaint ID: ${_id}
      
      Track your complaint here: https://crm.servsy.in/complaint/details/${_id}`;
   console.log("messageBody", messageBody);

   try {
      const message = await client.messages.create({
         from: process.env.TWILIO_WHATSAPP_NUMBER,
         to: `whatsapp:${formattedPhoneNumber}`,  // Ensure phone number includes country code
         body: messageBody
      });
      console.log("WhatsApp Message Sent:", message.sid);
   } catch (error) {
      console.error("WhatsApp Message Error:", error);
   }
};



const clientSms = new OneSignal.Client(process.env.ONESIGNAL_APP_ID, process.env.ONESIGNAL_REST_API_KEY);

// const sendSMS = async (phoneNumber, message) => {
//    try {
//       const notification = {
//          app_id: process.env.ONESIGNAL_APP_ID,
//          contents: { en: message },
//          include_phone_numbers: [phoneNumber], // Sending SMS
//       };
// console.log("notification",notification);
// console.log("ONESIGNAL_APP_ID",process.env.ONESIGNAL_APP_ID,process.env.ONESIGNAL_REST_API_KEY);

//       const response = await clientSms.createNotification(notification);
//       console.log("OneSignal SMS Sent:", response);
//    } catch (error) {
//       console.error("OneSignal SMS Error:", error);
//    }
// };

const formatPhoneNumber = (phoneNumber) => {
   if (!phoneNumber.startsWith("+")) {
      return `+91${phoneNumber}`; // Assuming India (+91), change as needed
   }
   return phoneNumber;
};

const sendSMS = async (phoneNumber, message) => {
   try {
      const response = await fetch("https://onesignal.com/api/v1/notifications", {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${process.env.ONESIGNAL_API_KEY}` // Ensure API key is correct
         },
         body: JSON.stringify({
            app_id: process.env.ONESIGNAL_APP_ID,
            name: "Complaint Update",  // 🔹 Add this field
            include_phone_numbers: [phoneNumber],
            contents: { en: message }
         })
      });

      const data = await response.json();
      console.log("✅ OneSignal SMS Response:", data);

      if (data.errors) {
         console.error("❌ OneSignal SMS Error:", data.errors);
      }

      return data;
   } catch (error) {
      console.error("❌ OneSignal SMS Error:", error);
      throw error;
   }
};


// const addComplaint = async (req, res) => {
//    try {
//       let body = req.body;
//       let { city, pincode, emailAddress, fullName, phoneNumber, serviceAddress, brandId } = body; // Extract email and fullName from request body
//       const email = emailAddress;
//       const uniqueId = body?.uniqueId;
      
//       let user = await UserModel.findOne({ email });

//       // If user is not registered, register them
//       if (!user) {
//          user = new UserModel({ email: emailAddress, name: fullName, contact: phoneNumber, address: serviceAddress, password: "12345678" });
//          await user.save();
//       }
//       // console.log(uniqueId);

//       if (uniqueId) {
//          const warranty = await ProductWarrantyModal.findOne({ 'records.uniqueId': uniqueId });
//          console.timeEnd("Find Warranty");
//          if (!warranty) {
//             return res.status(404).json({ status: false, msg: 'Warranty not found' });
//          }

//          // Find the specific record with the matching uniqueId
//          const record = warranty.records.find(record => record.uniqueId === uniqueId);
//          console.timeEnd("Find Record");
//          if (!record) {
//             return res.status(404).json({ status: false, msg: 'Warranty record not found' });
//          }



//          // Activate the warranty
//          record.isActivated = true;
//          record.userName = fullName;
//          record.email = email;
//          record.contact = phoneNumber;
//          record.address = serviceAddress;
//          record.district = body?.district;
//          record.state = body?.state;
//          record.pincode = pincode;
//          record.activationDate = new Date();

//          // Save the updated warranty
//          await warranty.save();
//       }

//       // Find a service center based on city or pincode
//       let serviceCenter;
//       // if (pincode) {
//       //    serviceCenter = await ServiceModel.findOne({
//       //       $or: [
//       //          { postalCode: pincode },
//       //          { pincodeSupported: { $in: [pincode] } }
//       //       ]
//       //    });
//       // } 
//       if (pincode) {
//          serviceCenter = await ServiceModel.findOne({
//             $and: [
//                {
//                   $or: [
//                      { postalCode: pincode },
//                      { pincodeSupported: { $in: [pincode] } }
//                   ]
//                },
//                { brandsSupported: { $in: [brandId] } }
//             ]
//          });

//       }
      


//       // Prepare the complaint object
//       let obj = {
//          ...body,
//          userId: user._id,
//          userName: user.name,
//          issueImages: req.file?.location,
//          assignServiceCenterId: serviceCenter?._id,
//          assignServiceCenter: serviceCenter?.serviceCenterName,
//          serviceCenterContact: serviceCenter?.contact,
//          assignServiceCenterTime: new Date()
//       };
//       //  && serviceCenter.serviceCenterType === "Independent"
//       if (serviceCenter) {
//          obj.status = "ASSIGN";
//       }
//       // Save the complaint
//       let data = new ComplaintModal(obj);
//       await data.save();

//       // Create a notification for the user
//       const notification = new NotificationModel({
//          complaintId: data._id,
//          userId: data.userId,
//          brandId: data.brandId,
//          serviceCenterId: serviceCenter?._id,
//          dealerId: data.dealerId,
//          userName: fullName,
//          title: `Complaint`,
//          message: `Registered Your Complaint, ${fullName}!`,
//       });
//       await notification.save();


//       const _id = data._id
//       // await sendWhatsAppMessage(fullName, phoneNumber, _id);

//       // const smsMessage = `Hello ${fullName}, your complaint (ID: ${data._id}) has been registered successfully.Track your complaint here: https://crm.servsy.in/complaint/details/${_id}`;
//       // await sendSMS(phoneNumber, smsMessage);
//       res.json({ status: true, msg: "Complaint Added", user: user });
//    } catch (err) {
//       console.error(err);
//       res.status(400).send(err);
//    }
// };


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
         state,
      } = body;

      const email = emailAddress;

      // Create or find user
      const user = await findOrCreateUser(email, fullName, phoneNumber, serviceAddress);

      // Handle warranty lookup and update
      if (uniqueId) {
         const success = await handleWarrantyUpdate(uniqueId, fullName, email, phoneNumber, serviceAddress, district, state, pincode);
         if (!success) {
            return res.status(404).json({ status: false, msg: 'Warranty record not found' });
         }
      }

      // Find service center
      const serviceCenter = await findServiceCenter(pincode, brandId);

      // Prepare complaint object
      const complaintData = {
         ...body,
         userId: user._id,
         userName: user.name,
         issueImages: req.file?.location,
         assignServiceCenterId: serviceCenter?._id,
         assignServiceCenter: serviceCenter?.serviceCenterName,
         serviceCenterContact: serviceCenter?.contact,
         assignServiceCenterTime: new Date(),
         status: serviceCenter ? 'ASSIGN' : 'PENDING',
      };

      const complaint = new ComplaintModal(complaintData);
      await complaint.save();

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

// ===================== HELPERS ====================== //

const findOrCreateUser = async (email, name, contact, address) => {
   let user = await UserModel.findOne({ email });
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

const handleWarrantyUpdate = async (uniqueId, name, email, contact, address, district, state, pincode) => {
   try {
      console.time('Update Warranty');

      const result = await ProductWarrantyModal.updateOne(
         { 'records.uniqueId': uniqueId },
         {
            $set: {
               'records.$.isActivated': true,
               'records.$.userName': name,
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

      console.log('Update result',result);
      console.timeEnd('Update Warranty');

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




const getAllBrandComplaint = async (req, res) => {
   try {
      let data = await ComplaintModal.find({}).sort({ _id: -1 });
      res.send(data)
   }
   catch (err) {
      res.status(400).send(err);
   }
}

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






const getAllComplaintByRole = async (req, res) => {
   try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Extract filters from query params
      const { brandId, serviceCenterId, technicianId, userId, dealerId } = req.query;

      // Build the filter object
      let filterConditions = {};

      if (brandId) filterConditions.brandId = brandId;
      if (serviceCenterId) filterConditions.assignServiceCenterId = serviceCenterId;
      if (technicianId) filterConditions.technicianId = technicianId;
      if (userId) filterConditions.userId = userId; // Assuming userId represents the customer
      if (dealerId) filterConditions.userId = dealerId; // Assuming userId represents the dealer

      // Get the total count of documents that match the filters
      const totalComplaints = await ComplaintModal.countDocuments(filterConditions);

      // Fetch the data with pagination and filters
      const data = await ComplaintModal.find(filterConditions)
         .sort({ _id: -1 }) // Sorting by newest complaints
         .skip(skip)
         .limit(limit);

      // Send response with filtered data and total count
      res.send({ data, totalComplaints });
   } catch (err) {
      console.error("Error fetching complaints:", err);
      res.status(500).send({ message: "Internal server error" });
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

const getComplaintByUniqueId= async (req, res) => {

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

const getComplaintsByPending = async (req, res) => {
   try {
      // let data = await ComplaintModal.find({ status: "PENDING" }).sort({ _id: -1 }); // Find all complaints with status "PENDING"
      const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }, );
    const activeBrandIds = activeBrands.map(b => b._id.toString()); // toString() for safe comparison

    // Step 2: Fetch all complaints
    const complaints = await ComplaintModal.find({ status: "PENDING" }).sort({ _id: -1 });

    // Step 3: Filter complaints with active brandId
    const filteredComplaints = complaints.filter(c =>
      activeBrandIds.includes(c.brandId?.toString())
    );
     let data=filteredComplaints;
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
     
        const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }, );
    const activeBrandIds = activeBrands.map(b => b._id.toString()); // toString() for safe comparison

    // Step 2: Fetch all complaints
    const complaints = await ComplaintModal.find({ status: "ASSIGN" }).sort({ _id: -1 });

    // Step 3: Filter complaints with active brandId
    const filteredComplaints = complaints.filter(c =>
      activeBrandIds.includes(c.brandId?.toString())
    );
     let data=filteredComplaints;
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
         const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }, );
    const activeBrandIds = activeBrands.map(b => b._id.toString()); // toString() for safe comparison

    // Step 2: Fetch all complaints
    const complaints = await ComplaintModal.find({ status: "IN PROGRESS" }).sort({ _id: -1 });

    // Step 3: Filter complaints with active brandId
    const filteredComplaints = complaints.filter(c =>
      activeBrandIds.includes(c.brandId?.toString())
    );
     let data=filteredComplaints;
      if (data.length === 0) {
         return res.status(404).send({ status: false, msg: "No pending complaints found." });
      }
      res.send(data);
   } catch (err) {
      res.status(400).send(err);
   }
};
const getComplaintsByComplete = async (req, res) => {
   try {
      // let data = await ComplaintModal.find({ status: "COMPLETED" }).sort({ _id: -1 }); // Find all complaints with status "PENDING"
     
        const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }, );
    const activeBrandIds = activeBrands.map(b => b._id.toString()); // toString() for safe comparison

    // Step 2: Fetch all complaints
    const complaints = await ComplaintModal.find({ status: "COMPLETED" }).sort({ _id: -1 });

    // Step 3: Filter complaints with active brandId
    const filteredComplaints = complaints.filter(c =>
      activeBrandIds.includes(c.brandId?.toString())
    );
     let data=filteredComplaints;
      if (data.length === 0) {
         return res.status(404).send({ status: false, msg: "No pending complaints found." });
      }
      res.send(data);
   } catch (err) {
      res.status(400).send(err);
   }
};
const getComplaintsByCancel = async (req, res) => {
   try {
      // let data = await ComplaintModal.find({ status: "CANCELED" }).sort({ _id: -1 }); // Find all complaints with status "PENDING"
       const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }, );
    const activeBrandIds = activeBrands.map(b => b._id.toString()); // toString() for safe comparison

    // Step 2: Fetch all complaints
    const complaints = await ComplaintModal.find({ status: "CANCELED" }).sort({ _id: -1 });

    // Step 3: Filter complaints with active brandId
    const filteredComplaints = complaints.filter(c =>
      activeBrandIds.includes(c.brandId?.toString())
    );
     let data=filteredComplaints;
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
     const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }, );
    const activeBrandIds = activeBrands.map(b => b._id.toString()); // toString() for safe comparison

   

    // Step 3: Filter complaints with active brandId
    const filteredComplaints = complaints.filter(c =>
      activeBrandIds.includes(c.brandId?.toString())
    );
     let data=filteredComplaints;
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
     
       const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }, );
    const activeBrandIds = activeBrands.map(b => b._id.toString()); // toString() for safe comparison

    // Step 2: Fetch all complaints
    const complaints = await ComplaintModal.find({ status: "FINAL VERIFICATION" }).sort({ _id: -1 });

    // Step 3: Filter complaints with active brandId
    const filteredComplaints = complaints.filter(c =>
      activeBrandIds.includes(c.brandId?.toString())
    );
     let data=filteredComplaints;
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
      
        const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }, );
    const activeBrandIds = activeBrands.map(b => b._id.toString()); // toString() for safe comparison

    // Step 2: Fetch all complaints
    const complaints = await ComplaintModal.find({ status: "PART PENDING" }).sort({ _id: -1 });

    // Step 3: Filter complaints with active brandId
    const filteredComplaints = complaints.filter(c =>
      activeBrandIds.includes(c.brandId?.toString())
    );
     let data=filteredComplaints;
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
     
      const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }, );
    const activeBrandIds = activeBrands.map(b => b._id.toString()); // toString() for safe comparison

    // Step 2: Fetch all complaints
    const complaints = await ComplaintModal.find({ status: "CUSTOMER SIDE PENDING" }).sort({ _id: -1 });

    // Step 3: Filter complaints with active brandId
    const filteredComplaints = complaints.filter(c =>
      activeBrandIds.includes(c.brandId?.toString())
    );
     let data=filteredComplaints;
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
      // Define today's date range
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      // Query for complaints created today
      const data = await ComplaintModal.find({
         createdAt: { $gte: startOfDay, $lte: endOfDay }
      }).sort({ _id: -1 });

      if (data.length === 0) {
         return res.status(404).send({ status: false, msg: "No complaints created today." });
      }

      res.send(data);
   } catch (err) {
      res.status(400).send(err);
   }
};




const getTodayCompletedComplaints = async (req, res) => {
   try {
      // Define today's date range
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      // Query for complaints with status "COMPLETED" or "FINAL VERIFICATION" updated today
      const data = await ComplaintModal.find({
         status: { $in: ["COMPLETED", "FINAL VERIFICATION"] },
         updatedAt: { $gte: startOfDay, $lte: endOfDay }
      }).sort({ _id: -1 });

      if (data.length === 0) {
         return res.status(404).send({ status: false, msg: "No completed or final verification complaints found for today." });
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
         startDate.setHours(0, 0, 0, 0);

         endDate = new Date(now);
         endDate.setDate(now.getDate() - 2);
         endDate.setHours(23, 59, 59, 999);
      } else if (days === "more-than-week") {
         endDate = new Date(now);
         endDate.setDate(now.getDate() - 5); // Ensure correct range
         endDate.setHours(23, 59, 59, 999);
      }

      //   let filter = { status: "PENDING"||"IN PROGRESS" };
      let filter = { status: { $in: ["PENDING", "IN PROGRESS"] } };

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
               status: { $nin: ["COMPLETED", "FINAL VERIFICATION", "CANCELED"] }
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
         startDate.setHours(0, 0, 0, 0);

         endDate = new Date(now);
         endDate.setDate(now.getDate() - 2);
         endDate.setHours(23, 59, 59, 999);
      } else if (days === "more-than-week") {
         endDate = new Date(now);
         endDate.setDate(now.getDate() - 6); // Ensure correct range
         endDate.setHours(23, 59, 59, 999);
      }

      let filter = { status: "PART PENDING" };


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

      if (body.status === "FINAL VERIFICATION") {
         data.complaintCloseTime = new Date();

      }
      if (body.status === "COMPLETED") {
         data.complaintCloseTime = new Date();

      }
      if (!data.complaintCloseTime && body.complaintCloseTime) {
         data.complaintCloseTime = new Date(); // Set only if it was never set before
      }
      // Apply updates to the complaint object
      Object.assign(data, body);

      // Save the updated complaint
      await data.save();
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

         if (subCatData) {

            const brandTrans = new BrandRechargeModel({
               brandId: data.brandId,
               brandName: data.productBrand,
               amount: -body?.paymentBrand,
               complaintId: data._id,
               description: "Complaint Close  Payout"
            });
            await brandTrans.save();
            const serviceCenterWallet = await WalletModel.findOne({ serviceCenterId: data.assignServiceCenterId }).exec();

            if (!serviceCenterWallet) {
               // Handle case where wallet is not found
               console.error('Wallet not found for service center:',);
               // return;
               return res.json({ status: true, msg: "Complaint Updated" });
            }

            serviceCenterWallet.totalCommission = (parseInt(serviceCenterWallet.totalCommission || 0) + parseInt(subCatData.payout));
            serviceCenterWallet.dueAmount = (parseInt(serviceCenterWallet.dueAmount || 0) + parseInt(subCatData.payout));
            // await serviceCenterWallet.save();


            const dealerWallet = await WalletModel.findOne({ serviceCenterId: data.dealerId }).exec();

            if (!dealerWallet) {
               // Handle case where wallet is not found
               console.error('Wallet not found for dealer:',);
               return res.json({ status: true, msg: "Complaint Updated" });
            }

            const payout = parseInt(subCatData.payout);

            // If dealerId is present, add 20% of payout, else add full payout
            const commissionToAdd = data.dealerId ? payout * 0.2 : payout;

            // Update service center's total commission and due amount
            dealerWallet.totalCommission = (parseInt(dealerWallet.totalCommission || 0) + commissionToAdd);
            dealerWallet.dueAmount = (parseInt(dealerWallet.dueAmount || 0) + commissionToAdd);

            await dealerWallet.save();
         }

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

      data.updateHistory.push({
         updatedAt: new Date(),
         changes: { ...body },
      });

      // Handle status updates
      if (body.status === "PART PENDING") {
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

         if (subCatData) {
            payout = parseInt(subCatData.payout || 0);
            data.paymentServiceCenter = payout || 0;

            if (isNaN(payout) || payout <= 0) {
               console.error("Invalid payout amount:", subCatData.payout);
               return res.json({ status: true, msg: "Complaint Updated with invalid payout" });
            }
            const serviceCenter = await ServiceModel.findOne({ _id: data.assignServiceCenterId });

            let existingPayment = await ServicePaymentModel.findOne({
               serviceCenterId: data.assignServiceCenterId,
               complaintId: data._id,
            });

            if (!existingPayment) {

               // if (serviceCenter) {
               //    await ServicePaymentModel.create({
               //       serviceCenterId: data.assignServiceCenterId,
               //       serviceCenterName: data.assignServiceCenter,
               //       payment: payout.toString(),
               //       description: "Service Center Payment for Completed Complaint",
               //       contactNo: serviceCenter.contact,
               //       complaintId: data._id,
               //       city: serviceCenter.city,
               //       address: serviceCenter.streetAddress,
               //       status: "UNPAID",
               //    });
               // }
            } else {
               console.log("Service payment already exists for complaint:", data._id);
            }
            // Service Center Wallet Update
            let serviceCenterWallet = await WalletModel.findOne({ serviceCenterId: data.assignServiceCenterId });
            if (serviceCenterWallet) {
               serviceCenterWallet.totalCommission += payout;
               serviceCenterWallet.dueAmount += payout;
               // await serviceCenterWallet.save();
            } else {
               console.warn("No wallet found for service center:", data.assignServiceCenterId);
            }

            // Dealer Wallet Update
            let dealerWallet = await WalletModel.findOne({ dealerId: data.dealerId });
            if (dealerWallet) {
               let commissionToAdd = data.dealerId ? payout * 0.2 : payout;
               dealerWallet.totalCommission += commissionToAdd;
               dealerWallet.dueAmount += commissionToAdd;
               await dealerWallet.save();
            } else {
               console.warn("No wallet found for dealer:", data.dealerId);
            }
         }

         else {

            let paymentServiceCenter = parseFloat(body?.paymentServiceCenter) || 0;
            const serviceCenter = await ServiceModel.findOne({ _id: data.assignServiceCenterId });

            let existingPayment = await ServicePaymentModel.findOne({
               serviceCenterId: data.assignServiceCenterId,
               complaintId: data._id,
            });

            if (!existingPayment) {

               if (serviceCenter) {
                  await ServicePaymentModel.create({
                     serviceCenterId: data.assignServiceCenterId,
                     serviceCenterName: data.assignServiceCenter,
                     payment: paymentServiceCenter.toString(),
                     description: "Service Center Payment for Completed Complaint",
                     contactNo: serviceCenter.contact,
                     complaintId: data._id,
                     city: serviceCenter.city,
                     address: serviceCenter.streetAddress,
                     status: "UNPAID",
                  });
               }
            } else {
               console.log("Service payment already exists for complaint:", data._id);
            }
            let serviceCenterWallet = await WalletModel.findOne({ serviceCenterId: data.assignServiceCenterId });
          
            if (serviceCenterWallet) {
               serviceCenterWallet.totalCommission += paymentServiceCenter;
               serviceCenterWallet.dueAmount += paymentServiceCenter;

               // await serviceCenterWallet.save();
            } else {
               console.warn("No wallet found for service center:", data.assignServiceCenterId);
            }
         }


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
   addComplaint, addDealerComplaint,getComplaintByUniqueId, getComplaintsByAssign, getComplaintsByCancel, getComplaintsByComplete
   , getComplaintsByInProgress, getComplaintsByUpcomming,getComplaintsByCustomerSidePending, getComplaintsByPartPending, getComplaintsByPending, getComplaintsByFinalVerification,
   getPendingComplaints,getTodayCompletedComplaints,getTodayCreatedComplaints, getPartPendingComplaints, addAPPComplaint, getAllBrandComplaint, getAllComplaintByRole, getAllComplaint, getComplaintByUserId, getComplaintByTechId, getComplaintBydealerId, getComplaintByCenterId, getComplaintById, updateComplaintComments, editIssueImage, updateFinalVerification, updatePartPendingImage, editComplaint, deleteComplaint, updateComplaint
};
