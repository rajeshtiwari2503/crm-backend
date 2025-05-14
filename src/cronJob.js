

const cron = require("node-cron");
const ComplaintModal = require("./models/complaint");
const { ServiceModel } = require("./models/registration");
const mongoose = require("mongoose");

console.log("✅ Cron job scheduler initialized...");
const { admin } = require('../src/firebase/index')
// Run every 60 minutes
// cron.schedule("0 * * * *", async () => {
//    console.log("🔄 Running scheduled task to assign service centers...");

//    try {
//       // Fetch pending complaints older than 2 minutes
//       const pendingComplaints = await ComplaintModal.find({
//          status: "PENDING",
//          createdAt: { $lte: new Date(Date.now() - 60 * 60 * 1000) }
//       });

//       console.log(`🟢 Found ${pendingComplaints.length} pending complaints`);

//       for (let complaint of pendingComplaints) {
       
//          let serviceCenter = await ServiceModel.findOne({
//             $and: [
//                {
//                   $or: [
//                      { postalCode: complaint.pincode },
//                      { pincodeSupported: { $in: [complaint.pincode] } }
//                   ]
//                },
//                { brandsSupported: { $elemMatch: { value: complaint.brandId.toString() } } }
//             ]
//          });

//          if (serviceCenter) {
//             console.log("🏢 Service Center Found:");
//             // console.log(`Service Center ID: ${serviceCenter._id}`);
//             // console.log(`Name: ${serviceCenter.serviceCenterName}`);
//             // console.log(`Contact: ${serviceCenter.contact}`);
//             let changes = {
//                assignServiceCenterId: serviceCenter._id,
//                assignServiceCenter: serviceCenter.serviceCenterName,
//                serviceCenterContact: serviceCenter.contact,
//                status: "ASSIGN",
//                autoAssign: "Yes"  
//            };

//             await ComplaintModal.findByIdAndUpdate(complaint._id, {
//                assignServiceCenterId: serviceCenter._id,
//                assignServiceCenter: serviceCenter.serviceCenterName,
//                serviceCenterContact: serviceCenter.contact,
//                status: "ASSIGN",
//                $push: {
//                   updateHistory: {
//                       updatedAt: Date.now(), // Using Date.now() for consistency
//                       changes,
//                   }
//                }
//             });


//             await sendNotification(
//                serviceCenter._id,  // Use serviceCenter._id instead of complaint.assignServiceCenterId
//                `Assign Complaint`,
//                `You have been assigned a new complaint (ID: ${complaint.complaintId}). Please review the details and take the necessary action.`
//             );

//             console.log(`✅ Assigned Service Center to Complaint ${complaint._id}`);
//          } else {
//             console.log(`⚠️ No service center found for complaint ${complaint._id}`);
//          }
//       }
//    } catch (error) {
//       console.error("❌ Error in assigning service center:", error);
//    }
// });

 

cron.schedule("0 * * * *", async () => {
  console.log("🔄 Running scheduled task to assign service centers...");

  try {
    const pendingComplaints = await ComplaintModal.find({
      status: "PENDING",
      createdAt: { $lte: new Date(Date.now() - 60 * 60 * 1000) } // 1 hour ago
    });

    console.log(`🟢 Found ${pendingComplaints.length} pending complaints`);

    for (let complaint of pendingComplaints) {
      // Find best-matched service center
      const serviceCenters = await ServiceModel.aggregate([
        {
          $match: {
            $or: [
              { postalCode: complaint.pincode },
              { pincodeSupported: { $in: [complaint.pincode] } }
            ],
            brandsSupported: { $elemMatch: { value: complaint.brandId.toString() } }
          }
        },
        {
          $addFields: {
            activeCalls: { $size: { $ifNull: ["$activeComplaints", []] } } // activeComplaints assumed to be an array
          }
        },
        {
          $project: {
            serviceCenterName: 1,
            contact: 1,
            avgTAT: 1,
            avgRT: 1,
            activeCalls: 1,
            priorityScore: {
              $add: [
                { $cond: [{ $lte: ["$avgTAT", 24] }, 10, 0] },
                { $cond: [{ $lte: ["$avgRT", 15] }, 10, 0] },
                { $subtract: [100, "$activeCalls"] }
              ]
            }
          }
        },
        { $sort: { priorityScore: -1 } },
        { $limit: 1 }
      ]);

      const serviceCenter = serviceCenters[0];

      if (serviceCenter) {
        const changes = {
          assignServiceCenterId: serviceCenter._id,
          assignServiceCenter: serviceCenter.serviceCenterName,
          serviceCenterContact: serviceCenter.contact,
          status: "ASSIGN",
          autoAssign: "Yes"
        };

        await ComplaintModal.findByIdAndUpdate(complaint._id, {
          ...changes,
          $push: {
            updateHistory: {
              updatedAt: Date.now(),
              changes
            }
          }
        });

        await sendNotification(
          serviceCenter._id,
          `Assign Complaint`,
          `You have been assigned a new complaint (ID: ${complaint.complaintId}). Please take action.`
        );

        console.log(`✅ Assigned Complaint ${complaint._id} to ${serviceCenter.serviceCenterName}`);
      } else {
        console.log(`⚠️ No matching service center found for Complaint ${complaint._id}`);
      }
    }
  } catch (error) {
    console.error("❌ Error assigning service centers:", error);
  }
});



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

const createWalletTransactions = async () => {
   try {
     const startOfPrevMonth = moment().subtract(1, 'month').startOf('month').toDate();
     const endOfPrevMonth = moment().subtract(1, 'month').endOf('month').toDate();
 console.log("startOfPrevMonth",startOfPrevMonth);
 console.log("endOfPrevMonth",endOfPrevMonth);
 
     const complaints = await ComplaintModal.find({
       createdAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth },
       status: { $in: ['COMPLETED', 'FINAL VERIFICATION'] },
     });
     console.log("Total complaints found:", complaints.length);
     let createdCount = 0;
 console.log("createdCount",createdCount);
 
     for (const data of complaints) {
       const serviceCenter = await ServiceModel.findOne({
         _id: data.assignServiceCenterId,
         serviceCenterType: 'Authorized',
       });
 
       
       if (!serviceCenter || !data.pincode || !serviceCenter.postalCode) continue;
 
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
 
 cron.schedule("01 17 8 * *", () => {
  console.log("Running wallet transaction job on the 6th at 5:58 PM...");
  // createWalletTransactions();
});

 
 
