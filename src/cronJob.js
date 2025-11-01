

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
const ProductWarrantyModal = require("./models/productWarranty");
const ProductModel = require("./models/product");

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









// const createWalletTransactions = async () => {
//   try {
//     const startOfPrevMonth = moment().subtract(1, 'month').startOf('month').toDate();
//     const endOfPrevMonth = moment().subtract(1, 'month').endOf('month').toDate();
// //     const startOfPrevMonth = moment().startOf('month').toDate();
// // const endOfPrevMonth = moment().endOf('month').toDate();

//     console.log("startOfPrevMonth", startOfPrevMonth);
//     console.log("endOfPrevMonth", endOfPrevMonth);

//     const paidComplaintIds = await ServicePaymentModel.distinct("complaintId");

//     const complaints = await ComplaintModal.find({
//       complaintCloseTime: { $gte: startOfPrevMonth, $lte: endOfPrevMonth },
//       status: { $in: ['COMPLETED', 'FINAL VERIFICATION'] },
//       assignServiceCenterId: { $exists: true, $ne: null, $ne: "" },
//       _id: { $nin: paidComplaintIds },
//     });

//     console.log("Complaints eligible for wallet transaction:", complaints.length);

//     // 🟡 Group by assignServiceCenterId
//     const groupedByCenter = {};
//     for (const complaint of complaints) {
//       const centerId = complaint.assignServiceCenterId.toString();
//       if (!groupedByCenter[centerId]) {
//         groupedByCenter[centerId] = [];
//       }
//       groupedByCenter[centerId].push(complaint);
//     }

//     let createdCount = 0;

//     // 🟢 Loop through each service center
//     for (const [centerId, centerComplaints] of Object.entries(groupedByCenter)) {
//       console.log(`\n🔧 Processing Service Center ID: ${centerId}, Complaints: ${centerComplaints.length}`);

//       const serviceCenter = await ServiceModel.findOne({
//         _id: centerId,
//         serviceCenterType: 'Authorized',
//       });

//       if (!serviceCenter) {
// console.warn(`❌ Skipping service center ${centerId}, name: ${serviceCenter?.serviceCenterName ?? 'N/A'} — not found or not Authorized`);

//         continue;
//       }
// console.log(`Processing service center ${centerId} - ${serviceCenter.serviceCenterName}`);
//       for (const data of centerComplaints) {
//         if (!data.pincode || !serviceCenter.postalCode) continue;

//         const existingPayment = await ServicePaymentModel.findOne({
//           serviceCenterId: centerId,
//           complaintId: data._id,
//         });

//         if (existingPayment) {
//           console.log("Payment already exists for complaint:", data._id);
//           continue;
//         }
// console.log("data.pincode, serviceCenter.postalCode",data.pincode, serviceCenter.postalCode)
//         const distance = await getDistanceInKm(data.pincode, serviceCenter.postalCode);
//         if (distance === null || isNaN(distance)) {
//           console.warn("Skipping complaint due to distance calculation failure:", data._id);
//           continue;
//         }

//         const isCSP = data.cspStatus === "YES";
//         const isInCity = distance <= 30;
//         let paymentAmount = 0;
//         let timeDiffInHours = 0;

//         if (isCSP) {
//           paymentAmount = isInCity ? 250 : 350;
//         } else {
//           // const assignTime = moment(data.assignServiceCenterTime);
//           // const closeTime = moment(data.complaintCloseTime);

//           // // ⏱️ Calculate hours difference excluding Sundays
//           // let current = assignTime.clone();
//           // while (current.isBefore(closeTime)) {
//           //   if (current.day() !== 0) {
//           //     const nextHour = current.clone().add(1, 'hour');
//           //     if (nextHour.isAfter(closeTime)) break;
//           //     timeDiffInHours++;
//           //   }
//           //   current.add(1, 'hour');

//           // }
// const assignTime = moment(data.assignServiceCenterTime);
// const closeTime = moment(data.complaintCloseTime);
// if (!assignTime.isValid() || !closeTime.isValid()) {
//   throw new Error("Invalid assignTime or closeTime provided");
// }

//  let timeDiffInHours = 0;
// let sundayCount = 0;
// let current = assignTime.clone().startOf("day");

// while (current.isSameOrBefore(closeTime, "day")) {
//   if (current.day() !== 0) {
//     const dayStart = moment.max(current.clone().startOf("day"), assignTime);
//     const dayEnd = moment.min(current.clone().endOf("day"), closeTime);

//     // Defensive check
//     if (dayStart.isValid() && dayEnd.isValid() && dayEnd.isAfter(dayStart)) {
//       timeDiffInHours += dayEnd.diff(dayStart, "hours");
//     }
//   } else {
//     sundayCount++;
//   }

//   current.add(1, "day");
// }


// console.log("⏱️ Hours excluding Sundays:", timeDiffInHours);
// console.log("📅 Number of Sundays:", sundayCount);

//           if (isInCity) {
//             if (timeDiffInHours <= 24) {
//               paymentAmount = 250;
//             } else if (timeDiffInHours <= 48) {
//               paymentAmount = 180;
//             } else if (timeDiffInHours <= 72) {
//               paymentAmount = 130;
//             } else {
//               paymentAmount = 80;
//             }
//           } else {
//             if (timeDiffInHours <= 48) {
//               paymentAmount = 350;
//             } else if (timeDiffInHours <= 72) {
//               paymentAmount = 300;
//             } else if (timeDiffInHours <= 90) {
//               paymentAmount = 250;
//             } else {
//               paymentAmount = 200;
//             }
//           }
//         }

//         const paymentData = {
//           serviceCenterId: centerId,
//           serviceCenterName: data.assignServiceCenter || serviceCenter.serviceCenterName,
//           payment: paymentAmount.toString(),
//           description: `Payment for Service Complaint ID ${data._id} - ${moment(data.createdAt).format("MMMM YYYY")} (${isCSP ? "CSP: YES, " : ""}${isInCity ? "In City" : "Out City"}, ${distance.toFixed(1)} km , Tat : ${timeDiffInHours} hours , charge, ₹${paymentAmount})`,
//           contactNo: serviceCenter.contact,
//           month: moment(data.complaintCloseTime).format("MMMM YYYY"),
//           complaintId: data._id,
//           city: serviceCenter.city,
//           address: serviceCenter.streetAddress,
//           status: "UNPAID",
//           ...(serviceCenter.qrCode ? { qrCode: serviceCenter.qrCode } : {}),
//           ...(serviceCenter.UPIid ? { UPIid: serviceCenter.UPIid } : {})
//         };

//         console.log("Creating service center payment:", paymentData);
//         // await ServicePaymentModel.create(paymentData);
//         createdCount++;
//       }
//     }

//     console.log(`✅ Wallet transactions generated successfully. Total created: ${createdCount}`);
//   } catch (error) {
//     console.error("❌ Error creating wallet transactions:", error);
//   }
// };

const createWalletTransactions = async () => {
  try {
    // 📅 Get previous month range
    const startOfPrevMonth = moment().subtract(1, "month").startOf("month").toDate();
    const endOfPrevMonth = moment().subtract(1, "month").endOf("month").toDate();

    console.log("startOfPrevMonth", startOfPrevMonth);
    console.log("endOfPrevMonth", endOfPrevMonth);

    // ✅ Already paid complaint IDs
    const paidComplaintIds = await ServicePaymentModel.distinct("complaintId");

    // 🔍 Complaints eligible for payments
    const complaints = await ComplaintModal.find({
      complaintCloseTime: { $gte: startOfPrevMonth, $lte: endOfPrevMonth },
      status: { $in: ["COMPLETED", "FINAL VERIFICATION"] },
      assignServiceCenterId: { $exists: true, $ne: null, $ne: "" },
      _id: { $nin: paidComplaintIds },
    });

    console.log("Complaints eligible for wallet transaction:", complaints.length);

    // 🟡 Group complaints by service center
    const groupedByCenter = {};
    for (const complaint of complaints) {
      const centerId = complaint.assignServiceCenterId.toString();
      if (!groupedByCenter[centerId]) {
        groupedByCenter[centerId] = [];
      }
      groupedByCenter[centerId].push(complaint);
    }

    let createdCount = 0;

    // 🟢 Loop through each service center
    for (const [centerId, centerComplaints] of Object.entries(groupedByCenter)) {
      console.log(`\n🔧 Processing Service Center ID: ${centerId}, Complaints: ${centerComplaints.length}`);

      const serviceCenter = await ServiceModel.findOne({
        _id: centerId,
        serviceCenterType: "Authorized",
      });

      if (!serviceCenter) {
        console.warn(`❌ Skipping service center ${centerId} — not found or not Authorized`);
        continue;
      }

      console.log(`Processing service center ${centerId} - ${serviceCenter.serviceCenterName}`);

      for (const data of centerComplaints) {
        if (!data.pincode || !serviceCenter.postalCode) continue;

        // ✅ Skip if payment already exists
        const existingPayment = await ServicePaymentModel.findOne({
          serviceCenterId: centerId,
          complaintId: data._id,
        });

        if (existingPayment) {
          console.log("Payment already exists for complaint:", data._id);
          continue;
        }

        // ✅ Distance check (cast to string to avoid mismatch issues)
        const distance = await getDistanceInKm(String(data.pincode), String(serviceCenter.postalCode));
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

          if (!assignTime.isValid() || !closeTime.isValid()) {
            console.warn("Invalid assignTime or closeTime:", data._id);
            continue;
          }

          // ✅ Safe calculation (hour-by-hour, skipping Sundays)
        
          let sundayCount = 0;

          let currentHour = assignTime.clone();

          while (currentHour.isBefore(closeTime)) {
            if (currentHour.day() !== 0) {
              // Count only non-Sunday hours
              timeDiffInHours++;
            } else {
              // Track Sunday hours
              sundayCount++;
            }
            currentHour.add(1, "hour");
          }

          console.log("⏱️ Hours excluding Sundays:", timeDiffInHours);
          console.log("📅 Hours on Sundays (excluded):", sundayCount);
          console.log("📆 Total hours (raw diff):", assignTime.diff(closeTime, "hours") * -1);


          // ✅ Payment slab calculation
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
            if (timeDiffInHours <= 48) {
              paymentAmount = 350;
            } else if (timeDiffInHours <= 72) {
              paymentAmount = 300;
            } else if (timeDiffInHours <= 90) {
              paymentAmount = 250;
            } else {
              paymentAmount = 200;
            }
          }
        }

        // ✅ Build payment object
        const paymentData = {
          serviceCenterId: centerId,
          serviceCenterName: data.assignServiceCenter || serviceCenter.serviceCenterName,
          payment: paymentAmount.toString(),
          description: `Payment for Service Complaint ID ${data._id} - ${moment(data.createdAt).format("MMMM YYYY")} (${isCSP ? "CSP: YES, " : "CSP: NO,"
            }${isInCity ? "In City" : "Out City"}, ${distance.toFixed(1)} km , Tat : ${
            // isCSP ? "N/A" : timeDiffInHours + " hours"
            timeDiffInHours + " hours"
            } , charge, ₹${paymentAmount})`,
          contactNo: serviceCenter.contact,
          month: moment(data.complaintCloseTime).format("MMMM YYYY"),
          complaintId: data._id,
          city: serviceCenter.city,
          address: serviceCenter.streetAddress,
          status: "UNPAID",
          ...(serviceCenter.qrCode ? { qrCode: serviceCenter.qrCode } : {}),
          ...(serviceCenter.UPIid ? { UPIid: serviceCenter.UPIid } : {}),
        };

        console.log("Creating service center payment:", paymentData);
        await ServicePaymentModel.create(paymentData);
        createdCount++;
      }
    }

    console.log(`✅ Wallet transactions generated successfully. Total created: ${createdCount}`);
  } catch (error) {
    console.error("❌ Error creating wallet transactions:", error);
  }
};

cron.schedule("44 17 14 10 *", () => {
  console.log("⏰ Running wallet transaction job on July 1st, 2025 at 11:08 AM...");
  createWalletTransactions();

});


async function cleanProductRecords() {
  try {
    const targetBrandId = "68a2fec108ab22c128f63b9f";

    // Count documents that match the brandId
    const count = await ProductWarrantyModal.countDocuments({ brandId: targetBrandId });
    console.log(`Found ${count} documents with brandId ${targetBrandId}`);

    if (count > 0) {
      // Remove productName and productId from all records
      const result = await ProductWarrantyModal.updateMany(
        { brandId: targetBrandId },
        {
          $unset: {
            "records.$[].productName": "",
            "records.$[].productId": ""
          }
        }
      );

      console.log(`Updated ${result.modifiedCount} documents.`);
    } else {
      console.log('No documents found to update.');
    }
  } catch (error) {
    console.error('Error cleaning product records:', error);
  }
}
// cleanProductRecords();

async function deleteProductWarranties() {
  try {
    const targetBrandId = "687b60524784729ee719776e    _w";
    const targetNumberOfGenerate = 5000;

    // Count documents that match the criteria
    const count = await ProductWarrantyModal.countDocuments({
      brandId: targetBrandId,
      numberOfGenerate: targetNumberOfGenerate
    });

    console.log(`Found ${count} documents with brandId ${targetBrandId} and numberOfGenerate ${targetNumberOfGenerate}`);

    if (count > 0) {
      // Delete the matching documents
      const result = await ProductWarrantyModal.deleteMany({
        brandId: targetBrandId,
        numberOfGenerate: targetNumberOfGenerate
      });

      console.log(`Deleted ${result.deletedCount} documents.`);
    } else {
      console.log('No documents found to delete.');
    }
  } catch (error) {
    console.error('Error deleting product warranties:', error);
  }
}
// deleteProductWarranties()

async function updateProductUserIdToBrandId() {
  try {
    console.log("Running cron job to update product brand info...");

    const userId = "68ca7ac8d16407d35cc6a528";
    const brandId = "68ca7ac8d16407d35cc6a528";
    const productBrand = "Activa";

    // Count products for this userId
    const productCount = await ProductModel.countDocuments({ userId });
    console.log(`Total products found for userId ${userId}: ${productCount}`);

    if (productCount === 0) {
      console.log("No products to update.");
      return;
    }

    // Update products for this userId
    const updateResult = await ProductModel.updateMany(
      { userId },
      {
        $set: {
          userId: brandId,
          brandId: brandId,
          productBrand: productBrand,
        },
      }
    );

    console.log(
      `Products updated: ${updateResult.modifiedCount} / ${productCount} for userId ${userId}`
    );
  } catch (error) {
    console.error("Cron job failed:", error);
  }
};
// updateProductUserIdToBrandId()
async function deleteComplaintNullData() {
  try {
    console.log("Running cron job to check complaints...");

    const filter = {
      productBrand: "Reeco",
      status: "PENDING",
      // productName: { $in: [null, ""] },
      contact: { $in: [null, ""] },
      pincode: { $in: [null, ""] },
      district: { $in: [null, ""] },

    };

    const count = await ComplaintModal.countDocuments(filter);
    console.log(`Total complaints to delete: ${count}`);

    // if (count > 0) {
    //   const result = await ComplaintModal.deleteMany(filter);
    //   console.log(`Deleted ${result.deletedCount} complaints.`);
    // }
  } catch (error) {
    console.error("Error while checking/deleting complaints:", error);
  }
};
// deleteComplaintNullData()

const deleteJuly31Transactions = async () => {
  try {
    const startOfDay = new Date("2025-07-31T00:00:00.000Z");
    const endOfDay = new Date("2025-07-31T23:59:59.999Z");

    console.log("🔍 Deleting wallet transactions created on 31 July 2025...");

    // Step 1: Get all authorized service centers
    const authorizedCenters = await ServiceModel.find(
      { serviceCenterType: "Authorized" },
      "_id serviceCenterName"
    );

    const authorizedCenterIds = authorizedCenters.map(c => c._id.toString());

    // Step 2: Find wallet transactions created on 31 July 2025 for these centers
    const transactions = await ServicePaymentModel.find({
      serviceCenterId: { $in: authorizedCenterIds },
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    if (transactions.length === 0) {
      console.log("✅ No wallet transactions found for deletion on 31 July 2025.");
      return;
    }

    // Step 3: Log transaction details
    console.log(`🧾 Found ${transactions.length} wallet transactions to delete:`);
    // console.log(`🧾 Found ${transactions } wallet transactions to delete:`);
    // transactions.forEach(txn => {
    //   console.log({
    //     _id: txn._id,
    //     serviceCenterId: txn.serviceCenterId,
    //     serviceCenterName: txn.serviceCenterName,
    //     complaintId: txn.complaintId,
    //     payment: txn.payment,
    //     createdAt: txn.createdAt,
    //     status: txn.status
    //   });
    // });

    // Step 4: Delete transactions
    const result = await ServicePaymentModel.deleteMany({
      _id: { $in: transactions.map(t => t._id) }
    });

    console.log(`🗑️ Deleted ${result.deletedCount} wallet transactions created on 31 July 2025.`);
  } catch (error) {
    console.error("❌ Error deleting wallet transactions:", error);
  }
};



// cron.schedule("7 15 20 8 *", async () => {
//    console.log("⏰ Running 687b60524784729ee719776e...");
//   const targetBrandId = "687b60524784729ee719776e";
//   const newBrandName = "Master";

//   try {
//     const warranties = await ProductWarrantyModal.find({ brandId: targetBrandId });
// console.log("warranties",warranties);

//     for (const warranty of warranties) {
//       // Update top-level brand name
//       warranty.brandName = newBrandName;

//       // Update each record's brand name
//       warranty.records = warranty.records.map((record) => {
//         if (record.brandId === targetBrandId) {
//           return {
//             ...record.toObject(),
//             brandName: newBrandName,
//           };
//         }
//         return record;
//       });
// console.log("warranties",warranties);
//       // Save the updated document
//       // await warranty.save();
//     }

//     console.log(`[${new Date().toISOString()}] Brand name updated to "Master".`);
//   } catch (err) {
//     console.error("Cron Job Error:", err.message);
//   }
// });

// Cron job: runs at 14:56 on 20th August change product brand 
// cron.schedule("15 15 20 8 *", async () => {
//   console.log("⏰ Running brand update cron...");

//   const targetBrandId = "687b60524784729ee719776e";
//   const newBrandName = "Master";

//   try {
//     // Update all products with the target brandId
//     const result = await ProductModel.updateMany(
//       { brandId: targetBrandId }, // filter
//       { $set: { productBrand: newBrandName } } // update
//     );

//     console.log(`[${new Date().toISOString()}] Updated ${result.modifiedCount} products to brandName: "${newBrandName}"`);
//   } catch (err) {
//     console.error("Cron Job Error:", err.message);
//   }
// });

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

