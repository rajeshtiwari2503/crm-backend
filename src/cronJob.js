

const cron = require("node-cron");
const ComplaintModal = require("./models/complaint");
const { ServiceModel } = require("./models/registration");
const mongoose = require("mongoose");
const axios = require('axios');

console.log("✅ Cron job scheduler initialized...");
const { admin } = require('../src/firebase/index')
// Run every 60 minutes




// cron.schedule("*/5 * * * *", async () => {
//   console.log("🔄 Running scheduled task to assign service centers...");

//   try {
//     const pendingComplaints = await ComplaintModal.find({
//       status: "PENDING",
//       createdAt: { $lte: new Date(Date.now() - 5 * 60 * 1000) } // 5 minutes ago
//     });

//     console.log(`🟢 Found ${pendingComplaints.length} pending complaints`);

//     for (let complaint of pendingComplaints) {
//       // Find best-matched service center
//       if (!complaint?.brandId) {
//         console.warn(`⚠️ Skipping complaint ${complaint.complaintId} due to missing brandId`);
//         continue;
//       }
//       const serviceCenters = await ServiceModel.aggregate([
//         {
//           $match: {
//             $or: [
//               { postalCode: complaint.pincode },
//               { pincodeSupported: { $in: [complaint.pincode] } }
//             ],
//             brandsSupported: { $elemMatch: { value: complaint?.brandId?.toString() } }
//           }
//         },
//         {
//           $addFields: {
//             activeCalls: { $size: { $ifNull: ["$activeComplaints", []] } } // activeComplaints assumed to be an array
//           }
//         },
//         {
//           $project: {
//             serviceCenterName: 1,
//             contact: 1,
//             avgTAT: 1,
//             avgRT: 1,
//             activeCalls: 1,
//             priorityScore: {
//               $add: [
//                 { $cond: [{ $lte: ["$avgTAT", 24] }, 10, 0] },
//                 { $cond: [{ $lte: ["$avgRT", 15] }, 10, 0] },
//                 { $subtract: [100, "$activeCalls"] }
//               ]
//             }
//           }
//         },
//         { $sort: { priorityScore: -1 } },
//         { $limit: 1 }
//       ]);

//       const serviceCenter = serviceCenters[0];

//       if (serviceCenter) {
//         const changes = {
//           assignServiceCenterId: serviceCenter._id,
//           assignServiceCenter: serviceCenter.serviceCenterName,
//           serviceCenterContact: serviceCenter.contact,
//           status: "ASSIGN",
//           autoAssign: "Yes"
//         };

//         await ComplaintModal.findByIdAndUpdate(complaint._id, {
//           ...changes,
//           $push: {
//             updateHistory: {
//               updatedAt: Date.now(),
//               changes
//             }
//           }
//         });

//         await sendNotification(
//           serviceCenter._id,
//           `Assign Complaint`,
//           `You have been assigned a new complaint (ID: ${complaint.complaintId}). Please take action.`
//         );

//         console.log(`✅ Assigned Complaint ${complaint?.complaintId} to ${serviceCenter.serviceCenterName}`);
//       } else {
//         console.log(`⚠️ No matching service center found for Complaint ${complaint.complaintId}`);
//       }
//     }
//   } catch (error) {
//     console.error("❌ Error assigning service centers:", error);
//   }
// });



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

const moment = require('moment');
const { Client } = require('@googlemaps/google-maps-services-js');
const client = new Client({});

const GOOGLE_MAPS_API_KEY = "AIzaSyC_L9VzjnWL4ent9VzCRAabM52RCcJJd2k";

const ServicePaymentModel = require('./models/servicePaymentModel');

const getDistanceInKm = async (originPincode, destinationPincode) => {
  try {
    const response = await client.distancematrix({
      params: {
        origins: [originPincode],
        destinations: [destinationPincode],
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    const distanceInMeters = response.data.rows[0].elements[0].distance.value;
    return distanceInMeters / 1000; // convert to KM
  } catch (error) {
    console.error("Distance fetch error:", error);
    return null;
  }
};

 
// const createWalletTransactions = async () => {
//   try {
//     const startOfPrevMonth = moment().subtract(1, 'month').startOf('month').toDate();
//     const endOfPrevMonth = moment().subtract(1, 'month').endOf('month').toDate();
//     console.log("startOfPrevMonth", startOfPrevMonth);
//     console.log("endOfPrevMonth", endOfPrevMonth);

//     // const complaints = await ComplaintModal.find({
//     //   createdAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth },
//     //   status: { $in: ['COMPLETED', 'FINAL VERIFICATION'] },
//     // });
//     const complaints = await ComplaintModal.find({
//       createdAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth },
//       status: { $in: ['COMPLETED', 'FINAL VERIFICATION'] },
//       assignServiceCenterId: { $exists: true, $ne: null, $ne: "" },
      
//     });


//     console.log("Total complaints found:", complaints.length);
//     let createdCount = 0;

//     for (const data of complaints) {
//       if (!data.assignServiceCenterId) {
//         console.warn("Skipping complaint because assignServiceCenterId is missing:", data._id);
//         continue;
//       }
//       const serviceCenter = await ServiceModel.findOne({
//         _id: data.assignServiceCenterId,
//         serviceCenterType: 'Authorized',
//       });

//       if (!serviceCenter || !data.pincode || !serviceCenter.postalCode) continue;

//       // ✅ Ensure either qrCode or UPIid exists
//       if (!serviceCenter.qrCode && !serviceCenter.UPIid) {
//         console.warn(`Skipping complaint ${data._id}: QR Code or UPI ID required.`);
//         continue;
//       }

//       const existingPayment = await ServicePaymentModel.findOne({
//         serviceCenterId: data.assignServiceCenterId,
//         complaintId: data._id,
//       });

//       if (existingPayment) {
//         console.log("Payment already exists for complaint:", data._id);
//         continue;
//       }

//       const distance = await getDistanceInKm(data.pincode, serviceCenter.postalCode);
//       if (distance === null || isNaN(distance)) {
//         console.warn("Skipping complaint due to distance calculation failure:", data._id);
//         continue;
//       }

//       const isCSP = data.cspStatus === "YES";
//       const isInCity = distance <= 30;
//       let paymentAmount = 0;
//       let timeDiffInHours = 0;

//       if (isCSP) {
//         paymentAmount = isInCity ? 250 : 350;
//       } else {
//         const assignTime = moment(data.assignServiceCenterTime);
//         const closeTime = moment(data.complaintCloseTime);
//         timeDiffInHours = closeTime.diff(assignTime, 'hours');

//         if (isInCity) {
//           if (timeDiffInHours <= 24) {
//             paymentAmount = 250;
//           } else if (timeDiffInHours <= 48) {
//             paymentAmount = 180;
//           } else if (timeDiffInHours <= 72) {
//             paymentAmount = 130;
//           } else {
//             paymentAmount = 80;
//           }
//         } else {
//           if (timeDiffInHours <= 24) {
//             paymentAmount = 350;
//           } else if (timeDiffInHours <= 48) {
//             paymentAmount = 300;
//           } else if (timeDiffInHours <= 72) {
//             paymentAmount = 250;
//           } else {
//             paymentAmount = 200;
//           }
//         }
//       }

//       const paymentData = {
//         serviceCenterId: data.assignServiceCenterId,
//         serviceCenterName: data.assignServiceCenter || serviceCenter.serviceCenterName,
//         payment: paymentAmount.toString(),
//         description: `Payment for Service Complaint ID ${data._id} - ${moment(data.createdAt).format("MMMM YYYY")} (${isCSP ? "CSP: YES, " : ""}${isInCity ? "In City" : "Out City"}, ${distance.toFixed(1)} km , Tat : ${timeDiffInHours} hours , charge, ₹${paymentAmount})`,
//         contactNo: serviceCenter.contact,
//         month: moment(data.createdAt).format("MMMM YYYY"),
//         complaintId: data._id,
//         city: serviceCenter.city,
//         address: serviceCenter.streetAddress,
//         status: "UNPAID",
//         ...(serviceCenter.qrCode ? { qrCode: serviceCenter.qrCode } : {}),
//         ...(serviceCenter.UPIid ? { UPIid: serviceCenter.UPIid } : {})
//       };

//       console.log("Creating service center payment:", paymentData);

//       await ServicePaymentModel.create(paymentData);
//       createdCount++;
//     }

//     console.log(`Wallet transactions generated successfully. Total created: ${createdCount}`);
//   } catch (error) {
//     console.error("Error creating wallet transactions:", error);
//   }
// };

const createWalletTransactions = async () => {
  try {
    const startOfPrevMonth = moment().subtract(1, 'month').startOf('month').toDate();
    const endOfPrevMonth = moment().subtract(1, 'month').endOf('month').toDate();
    console.log("startOfPrevMonth", startOfPrevMonth);
    console.log("endOfPrevMonth", endOfPrevMonth);

   const paidComplaintIds = await ServicePaymentModel.distinct("complaintId");

// Step 2: Get complaints which do NOT have a wallet transaction
const complaints = await ComplaintModal.find({
  createdAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth },
  status: { $in: ['COMPLETED', 'FINAL VERIFICATION'] },
  assignServiceCenterId: { $exists: true, $ne: null, $ne: "" },
  _id: { $nin: paidComplaintIds }, // ✅ this filters only unpaid ones
});

console.log("Complaints eligible for wallet transaction:", complaints.length);

    console.log("Total complaints found:", complaints.length);
    let createdCount = 0;

    for (const data of complaints) {
      if (!data.assignServiceCenterId) {
        console.warn("Skipping complaint because assignServiceCenterId is missing:", data._id);
        continue;
      }
      const serviceCenter = await ServiceModel.findOne({
        _id: data.assignServiceCenterId,
        serviceCenterType: 'Authorized',
      });

      if (!serviceCenter || !data.pincode || !serviceCenter.postalCode) continue;

      // ✅ Ensure either qrCode or UPIid exists
      if (!serviceCenter.qrCode && !serviceCenter.UPIid) {
        console.warn(`Skipping complaint ${data._id}: QR Code or UPI ID required.`);
        continue;
      }

      const existingPayment = await ServicePaymentModel.findOne({
        serviceCenterId: data.assignServiceCenterId,
        complaintId: data._id,
      });

      if (existingPayment) {
        console.log("Payment already exists for complaint:", data._id);
        continue;
      }

      const distance = await getDistanceInKm(data.pincode, serviceCenter.postalCode);
      if (distance === null || isNaN(distance)) {
        console.warn("Skipping complaint due to distance calculation failure:", data._id);
        continue;
      }

      const isCSP = data.cspStatus === "YES";
      const isInCity = distance <= 30;
      let paymentAmount = 0;
      let timeDiffInHours = 0;

      if (isCSP) {
        paymentAmount = isInCity ? 250 : 350;
      } else {
        const assignTime = moment(data.assignServiceCenterTime);
        const closeTime = moment(data.complaintCloseTime);
        timeDiffInHours = closeTime.diff(assignTime, 'hours');

        if (isInCity) {
          if (timeDiffInHours <= 24) {
            paymentAmount = 250;
          } else if (timeDiffInHours <= 48) {
            paymentAmount = 180;
          } else if (timeDiffInHours <= 72) {
            paymentAmount = 130;
          } else {
            paymentAmount = 80;
          }
        } else {
          if (timeDiffInHours <= 24) {
            paymentAmount = 350;
          } else if (timeDiffInHours <= 48) {
            paymentAmount = 300;
          } else if (timeDiffInHours <= 72) {
            paymentAmount = 250;
          } else {
            paymentAmount = 200;
          }
        }
      }

      const paymentData = {
        serviceCenterId: data.assignServiceCenterId,
        serviceCenterName: data.assignServiceCenter || serviceCenter.serviceCenterName,
        payment: paymentAmount.toString(),
        description: `Payment for Service Complaint ID ${data._id} - ${moment(data.createdAt).format("MMMM YYYY")} (${isCSP ? "CSP: YES, " : ""}${isInCity ? "In City" : "Out City"}, ${distance.toFixed(1)} km , Tat : ${timeDiffInHours} hours , charge, ₹${paymentAmount})`,
        contactNo: serviceCenter.contact,
        month: moment(data.createdAt).format("MMMM YYYY"),
        complaintId: data._id,
        city: serviceCenter.city,
        address: serviceCenter.streetAddress,
        status: "UNPAID",
        ...(serviceCenter.qrCode ? { qrCode: serviceCenter.qrCode } : {}),
        ...(serviceCenter.UPIid ? { UPIid: serviceCenter.UPIid } : {})
      };

      console.log("Creating service center payment:", paymentData);

      await ServicePaymentModel.create(paymentData);
      createdCount++;
    }

    console.log(`Wallet transactions generated successfully. Total created: ${createdCount}`);
  } catch (error) {
    console.error("Error creating wallet transactions:", error);
  }
};

cron.schedule("12 13 6 * *", () => {
  console.log("Running wallet transaction job on the 2nd at 11:00 AM...");
  createWalletTransactions();
});





// This function fetches district and state from pincode
const fetchLocationByPincode = async (pincode) => {
  try {
    const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
    if (response.data && response.data[0].Status === 'Success') {
      const { District, State } = response.data[0].PostOffice[0];
      return { district: District, state: State };
    } else {
      console.log(`No location data for pincode ${pincode}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching location for pincode ${pincode}:`, error.message);
    return null;
  }
};

// Cron job to run every night at 2:00 AM
// cron.schedule('41 17 * * *', async () => {
//   console.log('🔁 Running complaint location update job...');

//   try {
//     // Find complaints with a pincode but missing district or state
//     const complaints = await ComplaintModal.find({
//       pincode: { $exists: true, $ne: '' },
//       $or: [{ district: { $in: [null, ''] } }, { state: { $in: [null, ''] } }]
//     });

//     console.log(`📄 Found ${complaints.length} complaints to update.`);

//     for (const complaint of complaints) {
//       const { pincode } = complaint;
//       const location = await fetchLocationByPincode(pincode);

//       if (location) {
//         complaint.district = location.district;
//         complaint.state = location.state;
//         await complaint.save();
//         console.log(`✅ Updated complaint ${complaint._id}`);
//       }
//     }

//     console.log('🎉 Complaint location update job finished.');
//   } catch (error) {
//     console.error('❌ Error during complaint location update job:', error);
//   }
// });



const BRAND_ID = "677262f28b89ee789f62b03e"; // Replace with actual brand ID

// const updateCancelledComplaintsForBrand = async () => {
//   try {
//     // Step 1: Find all CANCEL complaints for the brand
//     const complaints = await ComplaintModal.find(
//       {
//         status: "CANCELED",
//         brandId: BRAND_ID
//       },
//       { _id: 1 } // Only fetch _id
//     );

//     if (complaints.length === 0) {
//       console.log(`[CRON] No CANCEL complaints found for brand ${BRAND_ID}.`);
//       return;
//     }

//     // Step 2: Log each Complaint ID
//     complaints.forEach((complaint) => {
//       console.log(`[CRON] ComplaintId: ${complaint._id} will be updated.`);
//     });

//     // Step 3: Update those complaints
//     const result = await ComplaintModal.updateMany(
//       {
//         _id: { $in: complaints.map(c => c._id) }
//       },
//       {
//         $set: {
//           status: "COMPLETED",
//           cancelComp: "yes",
//           assignServiceCenter: "",
//           assignServiceCenterId: ""
//         }
//       }
//     );

//     console.log(`[CRON] Updated ${result.modifiedCount} cancelled complaints for brand ${BRAND_ID}.`);

//   } catch (error) {
//     console.error("[CRON] Error updating cancelled complaints:", error);
//   }
// };

// Run every hour
//  cron.schedule("26 11 * * *", () => {
//   console.log("[CRON] Running complaint updater for CANCEL → COMPLETED for specific brand at 11:20 AM...");
//   updateCancelledComplaintsForBrand();
// });

 