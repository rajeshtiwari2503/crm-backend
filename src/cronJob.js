

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

cron.schedule("55 15 11 12 *", () => {
  console.log("⏰ Running wallet transaction job on Dec 1st, 2025 at 11:08 AM...");
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

const updateTransactions = async () => {
  try {
    // Step 1: Find all unpaid wallet transactions (no service center filter)
    const transactions = await ServicePaymentModel.find({
      status: "UNPAID"
    });

    if (transactions.length === 0) {
      console.log("✅ No unpaid wallet transactions found.");
      return;
    }

    console.log(`🧾 Found ${transactions.length} unpaid wallet transactions to update.`);

    // Step 2: Update all unpaid transactions to paid
    const result = await ServicePaymentModel.updateMany(
      { status: "UNPAID" },
      {
        $set: {
          status: "PAID",
          paidAt: new Date() // optional timestamp for payment
        }
      }
    );

    console.log(`💰 Updated ${result.modifiedCount} transactions to "paid".`);
  } catch (error) {
    console.error("❌ Error updating wallet transactions:", error);
  }
};

// updateTransactions()

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

const reopenList = [
  { complaintId: "AC2409AC968", phoneNumber: "9738517920" },
  { complaintId: "AC2409DI468", phoneNumber: "9986606915" },
  { complaintId: "AC2409AC565", phoneNumber: "9849098387" },
  { complaintId: "AC2409AC210", phoneNumber: "8853025249" },
  { complaintId: "AC2409AC934", phoneNumber: "9962338458" },
  { complaintId: "AC2509AC067", phoneNumber: "7003774041" },
  { complaintId: "AC2509AC154", phoneNumber: "7838585056" },
  { complaintId: "AC2509AC132", phoneNumber: "9962949924" },
  { complaintId: "AC2509AC932", phoneNumber: "9886642403" },
  { complaintId: "AC2509AC869", phoneNumber: "9640414611" },
  { complaintId: "AC2509AC887", phoneNumber: "9725798449" },
  { complaintId: "AC2509AC969", phoneNumber: "9543369878" },
  { complaintId: "AC2509AC863", phoneNumber: "7907243349" },
  { complaintId: "AC2509AC674", phoneNumber: "9845065950" },
  { complaintId: "AC2509AC387", phoneNumber: "7684034449" },
  { complaintId: "AC2509AC807", phoneNumber: "8696245979" },
  { complaintId: "AC2509AC875", phoneNumber: "8680972234" },
  { complaintId: "AC2509AC214", phoneNumber: "8921959621" },
  { complaintId: "AC2509DI640", phoneNumber: "8977970000" },
  { complaintId: "AC2609AC308", phoneNumber: "9676233721" },
  { complaintId: "AC2609AC056", phoneNumber: "9440178994" },
  { complaintId: "AC2609AC868", phoneNumber: "9814004021" },
  { complaintId: "AC2609AC482", phoneNumber: "7396235279" },
  { complaintId: "AC2609AC276", phoneNumber: "7411581405" },
  { complaintId: "AC2609AC424", phoneNumber: "8985450707" },
  { complaintId: "AC2609AC800", phoneNumber: "8309721112" },
  { complaintId: "AC2609AC710", phoneNumber: "8838924285" },
  { complaintId: "AC2609AC255", phoneNumber: "9509022229" },
  { complaintId: "AC2609AC620", phoneNumber: "9966396089" },
  { complaintId: "AC2609DI661", phoneNumber: "9021068128" },
  { complaintId: "AC2809AC441", phoneNumber: "8088092969" },
  { complaintId: "AC2809AC836", phoneNumber: "9443539140" },
  { complaintId: "AC2809AC737", phoneNumber: "9900477505" },
  { complaintId: "AC2809AC607", phoneNumber: "9446507294" },
  { complaintId: "AC2809AC060", phoneNumber: "8807735169" },
  { complaintId: "AC2809AC648", phoneNumber: "7667706600" },
  { complaintId: "AC2909AC068", phoneNumber: "8978025150" },
  { complaintId: "AC2909AC395", phoneNumber: "7095806269" },
  { complaintId: "AC2909AC623", phoneNumber: "9788756464" },
  { complaintId: "AC2909AC878", phoneNumber: "8884644370" },
  { complaintId: "AC2909AC966", phoneNumber: "9556150047" },
  { complaintId: "AC2909AC286", phoneNumber: "9790714190" },
  { complaintId: "AC2909AC456", phoneNumber: "8867285588" },
  { complaintId: "AC2909AC190", phoneNumber: "9490619995" },
  { complaintId: "AC2909JE768", phoneNumber: "9411461959" },
  { complaintId: "AC3009AC946", phoneNumber: "7893116321" },
  { complaintId: "AC3009AC588", phoneNumber: "9340043555" },
  { complaintId: "AC3009AC023", phoneNumber: "7447883232" },
  { complaintId: "AC3009AC870", phoneNumber: "8328571928" },
  { complaintId: "AC3009AC378", phoneNumber: "9671097097" },
  { complaintId: "AC3009AC668", phoneNumber: "8600014873" },
  { complaintId: "AC3009AC168", phoneNumber: "7031868143" },
  { complaintId: "AC3009AC902", phoneNumber: "8709935260" },
  { complaintId: "AC3009AC779", phoneNumber: "9820325826" },
  { complaintId: "AC0110AC865", phoneNumber: "9490140925" },
  { complaintId: "AC0110AC542", phoneNumber: "9429908714" },
  { complaintId: "AC0310AC898", phoneNumber: "7029510930" },
  { complaintId: "AC0310AC705", phoneNumber: "8423413524" },
  { complaintId: "AC0310DI302", phoneNumber: "9833922281" },
  { complaintId: "AC0310AC599", phoneNumber: "8050253124" },
  { complaintId: "AC0310AC690", phoneNumber: "9419966531" },
  { complaintId: "AC0310AC329", phoneNumber: "9889989899" },
  { complaintId: "AC0310AC338", phoneNumber: "9840893115" },
  { complaintId: "AC0310AC217", phoneNumber: "8604520497" },
  { complaintId: "AC0310AC323", phoneNumber: "9611669102" },
  { complaintId: "AC0310AC291", phoneNumber: "7075767554" },
  { complaintId: "AC0310AC923", phoneNumber: "9885828998" },
  { complaintId: "AC0310AC731", phoneNumber: "8273861942" },
  { complaintId: "AC0310AC854", phoneNumber: "9550279253" },
  { complaintId: "AC0310DI438", phoneNumber: "9540949795" },
  { complaintId: "AC0310AC602", phoneNumber: "9534711177" },
  { complaintId: "AC0510AC734", phoneNumber: "9994169779" },
  { complaintId: "AC0510AC093", phoneNumber: "9540949795" },
  { complaintId: "AC0510AC958", phoneNumber: "7899863618" },
  { complaintId: "AC0510AC132", phoneNumber: "9703462042" },
  { complaintId: "AC0510AC605", phoneNumber: "9494966206" },
  { complaintId: "AC0510DI573", phoneNumber: "8830023908" },
  { complaintId: "AC0510AC590", phoneNumber: "7005111876" },
  { complaintId: "AC0510AC831", phoneNumber: "7976888847" },
  { complaintId: "AC0510AC842", phoneNumber: "9540949795" },
  { complaintId: "AC0510AC938", phoneNumber: "9688596400" },
  { complaintId: "AC0610AC126", phoneNumber: "8434258782" },
  { complaintId: "AC0610AC018", phoneNumber: "8089458109" },
  { complaintId: "AC0610DI338", phoneNumber: "7002424399" },
  { complaintId: "AC0610AC207", phoneNumber: "8235918985" },
  { complaintId: "AC0610AC170", phoneNumber: "9466191619" },
  { complaintId: "AC0610AC533", phoneNumber: "8787048043" },
  { complaintId: "AC0610AC614", phoneNumber: "9649362825" },
  { complaintId: "AC0610AC582", phoneNumber: "9952301070" },
  { complaintId: "AC0610AC588", phoneNumber: "7717778577" },
  { complaintId: "AC0610AC856", phoneNumber: "8368227419" },
  { complaintId: "AC0710AC841", phoneNumber: "7902843261" },
  { complaintId: "AC0710AC073", phoneNumber: "8054577398" },
  { complaintId: "AC0710AC272", phoneNumber: "8072013006" },
  { complaintId: "AC0710DI956", phoneNumber: "7310914268" },
  { complaintId: "AC0710AC121", phoneNumber: "9949639009" },
  { complaintId: "AC0710DI435", phoneNumber: "9845085440" },
  { complaintId: "AC0710AC401", phoneNumber: "7401231478" },
  { complaintId: "AC0710AC477", phoneNumber: "9869637775" },
  { complaintId: "AC0710AC802", phoneNumber: "8467085729" },
  { complaintId: "AC0710AC349", phoneNumber: "9894480583" },
  { complaintId: "AC0710DI726", phoneNumber: "9035674752" },
  { complaintId: "AC0710AC876", phoneNumber: "9900097574" },
  { complaintId: "AC0710AC594", phoneNumber: "9625992579" },
  { complaintId: "AC0710DI129", phoneNumber: "9000695305" },
  { complaintId: "AC0710AC031", phoneNumber: "9871019746" },
  { complaintId: "AC0710AC885", phoneNumber: "8951267295" },
  { complaintId: "AC0710AC561", phoneNumber: "7995601304" },
  { complaintId: "AC0810AC263", phoneNumber: "9693038781" },
  { complaintId: "AC0810AC477", phoneNumber: "9629848269" },
  { complaintId: "AC0810AC251", phoneNumber: "9944176200" },
  { complaintId: "AC0810AC868", phoneNumber: "7208783998" },
  { complaintId: "AC0810AC643", phoneNumber: "9611657750" },
  { complaintId: "AC0810AC004", phoneNumber: "8866559574" },
  { complaintId: "AC0810AC090", phoneNumber: "9989168424" },
  { complaintId: "AC0810AC217", phoneNumber: "7738024141" },
  { complaintId: "AC0810AC483", phoneNumber: "8830129083" },
  { complaintId: "AC0810AC646", phoneNumber: "9002388544" },
  { complaintId: "AC0810AC096", phoneNumber: "8447452815" },
  { complaintId: "AC0810JE424", phoneNumber: "8558847124" },
  { complaintId: "AC0910AC261", phoneNumber: "9873848968" },
  { complaintId: "AC0910AC369", phoneNumber: "9436149588" },
  { complaintId: "AC0910AC816", phoneNumber: "9537156325" },
  { complaintId: "AC0910AC964", phoneNumber: "7827455573" },
  { complaintId: "AC0910AC693", phoneNumber: "7814583843" },
  { complaintId: "AC0910AC168", phoneNumber: "7730078160" },
  { complaintId: "AC0910AC787", phoneNumber: "9535167448" },
  { complaintId: "AC0910AC450", phoneNumber: "8299112988" },
  { complaintId: "AC0910AC497", phoneNumber: "6392737475" },
  { complaintId: "AC0910AC119", phoneNumber: "8340167060" },
  { complaintId: "AC0910AC413", phoneNumber: "7738659974" },
  { complaintId: "AC0910AC461", phoneNumber: "9927202700" },
  { complaintId: "AC1010AC262", phoneNumber: "8586843496" },
  { complaintId: "AC1010AC152", phoneNumber: "8080740771" },
  { complaintId: "AC1010AC068", phoneNumber: "8503045620" },
  { complaintId: "AC1010AC462", phoneNumber: "8140913618" },
  { complaintId: "AC1010AC336", phoneNumber: "9268341497" },
  { complaintId: "AC1010AC789", phoneNumber: "9418066648" },
  { complaintId: "AC1010AC657", phoneNumber: "8827449760" },
  { complaintId: "AC1010AC034", phoneNumber: "9830245172" },
  { complaintId: "AC1210AC883", phoneNumber: "9974455101" },
  { complaintId: "AC1210AC191", phoneNumber: "8585965534" },
  { complaintId: "AC1210AC230", phoneNumber: "9733170283" },
  { complaintId: "AC1210AC754", phoneNumber: "9935099755" },
  { complaintId: "AC1210AC100", phoneNumber: "9971610123" },
  { complaintId: "AC1210AC386", phoneNumber: "9307247937" },
  { complaintId: "AC1210AC072", phoneNumber: "8171575011" },
  { complaintId: "AC1210AC066", phoneNumber: "7384978578" },
  { complaintId: "AC1210AC452", phoneNumber: "8146430497" },
  { complaintId: "AC1210AC301", phoneNumber: "9898164391" },
  { complaintId: "AC1210AC964", phoneNumber: "7607123349" },
  { complaintId: "AC1210AC969", phoneNumber: "9821033757" },
  { complaintId: "AC1210AC568", phoneNumber: "8447452815" },
  { complaintId: "AC1210AC095", phoneNumber: "9770246739" },
  { complaintId: "AC1410AC270", phoneNumber: "9414756657" },
  { complaintId: "AC1410AC304", phoneNumber: "7568966519" },
  { complaintId: "AC1410AC396", phoneNumber: "9734552764" },
  { complaintId: "AC1410AC854", phoneNumber: "9610716553" },
  { complaintId: "AC1410AC055", phoneNumber: "7827577392" },
  { complaintId: "AC1410AC504", phoneNumber: "8318073303" },
  { complaintId: "AC1410AC283", phoneNumber: "9031156783" },
  { complaintId: "AC1410AC365", phoneNumber: "7377436115" },
  { complaintId: "AC1410DI758", phoneNumber: "9477016486" },
  { complaintId: "AC1410AC715", phoneNumber: "7763919023" },
  { complaintId: "AC1410AC431", phoneNumber: "9889719433" },
  { complaintId: "AC1510AC007", phoneNumber: "9058995606" },
  { complaintId: "AC1510AC791", phoneNumber: "8667579563" },
  { complaintId: "AC1510AC746", phoneNumber: "8329679442" },
  { complaintId: "AC1510AC108", phoneNumber: "8588842164" },
  { complaintId: "AC1510AC697", phoneNumber: "9157536704" },
  { complaintId: "AC1510AC743", phoneNumber: "9832652411" },
  { complaintId: "AC1510AC400", phoneNumber: "7734050820" },
  { complaintId: "AC1510AC525", phoneNumber: "9618848031" },
  { complaintId: "AC1510AC869", phoneNumber: "8918456118" },
  { complaintId: "AC1610AC821", phoneNumber: "9738672744" },
  { complaintId: "AC1610AC952", phoneNumber: "6360997345" },
  { complaintId: "AC1610AC375", phoneNumber: "7845153590" },
  { complaintId: "AC1610AC336", phoneNumber: "9729589747" },
  { complaintId: "AC1610DI407", phoneNumber: "7002589529" },
  { complaintId: "AC1610AC647", phoneNumber: "9975829959" },
  { complaintId: "AC1610AC199", phoneNumber: "7717734037" },
  { complaintId: "AC1610AC204", phoneNumber: "9033990766" },
  { complaintId: "AC1610AC226", phoneNumber: "7661937090" },
  { complaintId: "AC1610AC390", phoneNumber: "9582453433" },
  { complaintId: "AC1610AC333", phoneNumber: "8510078695" },
  { complaintId: "AC1610AC519", phoneNumber: "8630487221" },
  { complaintId: "AC1710AC632", phoneNumber: "9044099300" },
  { complaintId: "AC1710AC151", phoneNumber: "9643105375" },
  { complaintId: "AC1710AC045", phoneNumber: "7665828926" },
  { complaintId: "AC1710AC132", phoneNumber: "9510399595" },
  { complaintId: "AC1710AC411", phoneNumber: "7840042073" },
  { complaintId: "AC1710AC330", phoneNumber: "8385820201" },
  { complaintId: "AC1710AC241", phoneNumber: "9247847809" },
  { complaintId: "AC1910AC551", phoneNumber: "9925300390" },
  { complaintId: "AC1910AC309", phoneNumber: "8384003916" },
  { complaintId: "AC1910AC130", phoneNumber: "8790057499" },
  { complaintId: "AC1910AC182", phoneNumber: "8750185820" },
  { complaintId: "AC2210AC461", phoneNumber: "9870249122" },
  { complaintId: "AC2210AC972", phoneNumber: "8651134452" },
  { complaintId: "AC2210AC641", phoneNumber: "9435718137" },
  { complaintId: "AC2210AC510", phoneNumber: "8586063035" },
  { complaintId: "AC2210AC389", phoneNumber: "9972041885" },
  { complaintId: "AC2210AC289", phoneNumber: "9752902133" },
  { complaintId: "AC2210DI530", phoneNumber: "7002424399" },
  { complaintId: "AC2210AC870", phoneNumber: "8135951306" },
  { complaintId: "AC2210AC164", phoneNumber: "8317634168" },
  { complaintId: "AC2210AC576", phoneNumber: "9814865133" },
  { complaintId: "AC2210AC269", phoneNumber: "9881894718" },
  { complaintId: "AC2210AC466", phoneNumber: "9539250300" },
  { complaintId: "AC2210AC975", phoneNumber: "9215585663" },
  { complaintId: "AC2210AC537", phoneNumber: "8595262930" },
  { complaintId: "AC2210AC976", phoneNumber: "9677233256" },
  { complaintId: "AC2210AC712", phoneNumber: "9679419831" },
  { complaintId: "AC2210AC541", phoneNumber: "7908280649" },
  { complaintId: "AC2210DI848", phoneNumber: "8149686944" },
  { complaintId: "AC2310AC892", phoneNumber: "8858333340" },
  { complaintId: "AC2310AC736", phoneNumber: "8808890588" },
  { complaintId: "AC2310AC692", phoneNumber: "9718221729" },
  { complaintId: "AC2310AC633", phoneNumber: "7801091586" },
  { complaintId: "AC2310AC998", phoneNumber: "6200856288" },
  { complaintId: "AC2310AC905", phoneNumber: "9740808601" },
  { complaintId: "AC2310AC188", phoneNumber: "9545550083" },
  { complaintId: "AC2310AC186", phoneNumber: "7800504290" },
  { complaintId: "AC2410AC618", phoneNumber: "9078686953" },
  { complaintId: "AC2410AC761", phoneNumber: "8867456404" },
  { complaintId: "AC2410AC723", phoneNumber: "8688866603" },
  { complaintId: "AC2410AC185", phoneNumber: "9728075213" },
  { complaintId: "AC2410AC278", phoneNumber: "9870002526" },
  { complaintId: "AC2410AC950", phoneNumber: "9719977248" },
  { complaintId: "AC2410AC983", phoneNumber: "8007134051" },
  { complaintId: "AC2410AC598", phoneNumber: "8853081777" },
  { complaintId: "AC2410AC798", phoneNumber: "8126120845" },
  { complaintId: "AC2410AC740", phoneNumber: "8871500012" },
  { complaintId: "AC2410AC082", phoneNumber: "7984065744" },
  { complaintId: "AC2410AC510", phoneNumber: "9991157999" },
  { complaintId: "AC2610AC658", phoneNumber: "9421559054" },
  { complaintId: "AC2610DI510", phoneNumber: "9542213342" },
  { complaintId: "AC2610AC558", phoneNumber: "7505344202" },
  { complaintId: "AC2610AC646", phoneNumber: "8796164950" },
  { complaintId: "AC2610AC274", phoneNumber: "7904046183" },
  { complaintId: "AC2610AC998", phoneNumber: "9418675755" },
  { complaintId: "AC2610AC439", phoneNumber: "8527471247" },
  { complaintId: "AC2610AC698", phoneNumber: "9049124403" },
  { complaintId: "AC2610AC718", phoneNumber: "9711914297" },
  { complaintId: "AC2610AC345", phoneNumber: "9958067737" },
  { complaintId: "AC2610AC153", phoneNumber: "7019302360" },
  { complaintId: "AC2610AC726", phoneNumber: "7355761831" },
  { complaintId: "AC2610AC856", phoneNumber: "9010085899" },
  { complaintId: "AC2610AC129", phoneNumber: "9731078079" },
  { complaintId: "AC2610AC182", phoneNumber: "9550105275" },
  { complaintId: "AC2610AC717", phoneNumber: "9962624456" },
  { complaintId: "AC2610AC040", phoneNumber: "9900612173" },
  { complaintId: "AC2610AC742", phoneNumber: "9802581317" },
  { complaintId: "AC2610AC459", phoneNumber: "9810553964" },
  { complaintId: "AC2610AC920", phoneNumber: "9830345699" },
  { complaintId: "AC2610AC764", phoneNumber: "9748724764" },
  { complaintId: "AC2610AC873", phoneNumber: "7503186916" },
  { complaintId: "AC2610AC035", phoneNumber: "9321522727" },
  { complaintId: "AC2610AC130", phoneNumber: "9785302466" },
  { complaintId: "AC2710AC546", phoneNumber: "9552513679" },
  { complaintId: "AC2710AC100", phoneNumber: "9810366563" },
  { complaintId: "AC2710AC761", phoneNumber: "9999119793" },
  { complaintId: "AC2710AC444", phoneNumber: "9927202700" },
  { complaintId: "AC2710AC583", phoneNumber: "9900910922" },
  { complaintId: "AC2710AC471", phoneNumber: "9886077636" },
  { complaintId: "AC2710AC515", phoneNumber: "9804416526" },
  { complaintId: "AC2710AC564", phoneNumber: "8451834813" },
  { complaintId: "AC2710AC956", phoneNumber: "9999962556" },
  { complaintId: "AC2710AC520", phoneNumber: "9719232528" },
  { complaintId: "AC2710AC936", phoneNumber: "8805200794" },
  { complaintId: "AC2710AC287", phoneNumber: "9726249735" },
  { complaintId: "AC2710AC074", phoneNumber: "8109646708" },
  { complaintId: "AC2710AC249", phoneNumber: "9825612245" },
  { complaintId: "AC2710AC569", phoneNumber: "9433665488" },
  { complaintId: "AC2710AC829", phoneNumber: "8130722709" },
  { complaintId: "AC2710DI525", phoneNumber: "8802765554" },
  { complaintId: "AC2710DI746", phoneNumber: "9744862765" },
  { complaintId: "AC2710AC478", phoneNumber: "9279674140" },
  { complaintId: "AC2710AC401", phoneNumber: "8299368415" },
  { complaintId: "AC2710AC987", phoneNumber: "8299300697" },
  { complaintId: "AC2710AC551", phoneNumber: "9889869858" },
  { complaintId: "AC2710AC880", phoneNumber: "7708811826" },
  { complaintId: "AC2710AC588", phoneNumber: "9535654019" },
  { complaintId: "AC2710AC154", phoneNumber: "7276249468" },
  { complaintId: "AC2710AC611", phoneNumber: "9420384130" },
  { complaintId: "AC2810AC961", phoneNumber: "8608136989" },
  { complaintId: "AC2810AC892", phoneNumber: "9555558971" },
  { complaintId: "AC2810AC698", phoneNumber: "8329956764" },
  { complaintId: "AC2810AC129", phoneNumber: "9916845792" },
  { complaintId: "AC2810AC172", phoneNumber: "7006231496" },
  { complaintId: "AC2810AC558", phoneNumber: "7062070408" },
  { complaintId: "AC2810AC886", phoneNumber: "9369388474" },
  { complaintId: "AC2810DI104", phoneNumber: "9869046934" },
  { complaintId: "AC2810DI735", phoneNumber: "6307987355" },
  { complaintId: "AC2810AC640", phoneNumber: "7508024996" },
  { complaintId: "AC2810AC151", phoneNumber: "9006958824" },
  { complaintId: "AC2810AC522", phoneNumber: "9038988542" },
  { complaintId: "AC2810AC658", phoneNumber: "7003283502" },
  { complaintId: "AC2910AC110", phoneNumber: "9486482408" },
  { complaintId: "AC2910AC291", phoneNumber: "8780912954" },
  { complaintId: "AC2910AC058", phoneNumber: "9626267070" },
  { complaintId: "AC2910AC546", phoneNumber: "9226487387" },
  { complaintId: "AC2910AC758", phoneNumber: "9711550770" },
  { complaintId: "AC2910AC813", phoneNumber: "9438166243" },
  { complaintId: "AC2910AC616", phoneNumber: "6295844136" },
  { complaintId: "AC2910AC608", phoneNumber: "9958359662" },
  { complaintId: "AC2910DI708", phoneNumber: "9051645626" },
  { complaintId: "AC2910AC308", phoneNumber: "8435133306" },
  { complaintId: "AC3010AC647", phoneNumber: "9466782855" },
  { complaintId: "AC3010AC104", phoneNumber: "9871175552" },
  { complaintId: "AC3010AC890", phoneNumber: "9627286187" },
  { complaintId: "AC3010AC495", phoneNumber: "9873768493" },
  { complaintId: "AC3010AC730", phoneNumber: "9431154570" },
  { complaintId: "AC3010AC896", phoneNumber: "8130499715" },
  { complaintId: "AC3010AC549", phoneNumber: "8560888805" },
  { complaintId: "AC3010AC088", phoneNumber: "9938853583" },
  { complaintId: "AC3110DI192", phoneNumber: "7011943987" },
  { complaintId: "AC3110DI605", phoneNumber: "8120246247" },
  { complaintId: "AC3110AC156", phoneNumber: "9629433350" },
  { complaintId: "AC0311AC793", phoneNumber: "9319901231" },
  { complaintId: "AC0311AC297", phoneNumber: "9601269675" },
  { complaintId: "AC0311AC773", phoneNumber: "8451882643" },
  { complaintId: "AC0311AC872", phoneNumber: "9471737789" },
  { complaintId: "AC0311AC640", phoneNumber: "8707741737" },
  { complaintId: "AC0311AC119", phoneNumber: "7300743611" },
  { complaintId: "AC0311AC061", phoneNumber: "7058236497" },
  { complaintId: "AC0311AC879", phoneNumber: "9928431090" },
  { complaintId: "AC0311AC030", phoneNumber: "8250460186" },
  { complaintId: "AC0311AC999", phoneNumber: "9004217798" },
  { complaintId: "AC0311AC059", phoneNumber: "7507472599" },
  { complaintId: "AC0311AC977", phoneNumber: "9871193219" },
  { complaintId: "AC0311AC307", phoneNumber: "8492936456" },
  { complaintId: "AC0311AC715", phoneNumber: "9604157749" },
  { complaintId: "AC0311AC951", phoneNumber: "8860528112" },
  { complaintId: "AC0311AC975", phoneNumber: "8800894163" },
  { complaintId: "AC0311AC553", phoneNumber: "7781004435" },
  { complaintId: "AC0311AC029", phoneNumber: "9716648811" },
  { complaintId: "AC0311AC214", phoneNumber: "8972610016" },
  { complaintId: "AC0311AC500", phoneNumber: "9802244899" },
  { complaintId: "AC0411AC087", phoneNumber: "9328145259" },
  { complaintId: "AC0411AC700", phoneNumber: "7250687060" },
  { complaintId: "AC0411AC834", phoneNumber: "8851605032" },
  { complaintId: "AC0411AC394", phoneNumber: "9504503654" },
  { complaintId: "AC0411AC675", phoneNumber: "9960698359" },
  { complaintId: "AC0411AC190", phoneNumber: "9015560434" },
  { complaintId: "AC0411AC877", phoneNumber: "8448275599" },
  { complaintId: "AC0411AC491", phoneNumber: "9896260500" },
  { complaintId: "AC0411AC151", phoneNumber: "9827383696" },
  { complaintId: "AC0411AC643", phoneNumber: "9882179655" },
  { complaintId: "AC0411DI572", phoneNumber: "9927292901" },
  { complaintId: "AC0411AC451", phoneNumber: "9251001600" },
  { complaintId: "AC0511AC974", phoneNumber: "8981116903" },
  { complaintId: "AC0511AC050", phoneNumber: "9567475666" },
  { complaintId: "AC0511AC590", phoneNumber: "7036544478" },
  { complaintId: "AC0511AC394", phoneNumber: "9824341359" },
  { complaintId: "AC0511AC242", phoneNumber: "9701225580" },
  { complaintId: "AC0511DI875", phoneNumber: "9015379055" },
  { complaintId: "AC0511AC609", phoneNumber: "8871326015" },
  { complaintId: "AC0511AC153", phoneNumber: "8750643162" },
  { complaintId: "AC0511AC455", phoneNumber: "8950393397" },
  { complaintId: "AC0511AC229", phoneNumber: "9527377105" },
  { complaintId: "AC0511AC234", phoneNumber: "7908558703" },
  { complaintId: "AC0511AC830", phoneNumber: "9993052966" },
  { complaintId: "AC0511AC036", phoneNumber: "9594987666" },
  { complaintId: "AC0511AC121", phoneNumber: "8222074041" },
  { complaintId: "AC0511AC956", phoneNumber: "7623881627" },
  { complaintId: "AC0611AC493", phoneNumber: "8910103630" },
  { complaintId: "AC0611AC882", phoneNumber: "8218561840" },
  { complaintId: "AC0611AC328", phoneNumber: "8082209277" },
  { complaintId: "AC0611AC623", phoneNumber: "9958711710" },
  { complaintId: "AC0611AC615", phoneNumber: "7888720905" },
  { complaintId: "AC0611AC261", phoneNumber: "9540002041" },
  { complaintId: "AC0611JE561", phoneNumber: "9450061978" },
  { complaintId: "AC0611AC405", phoneNumber: "9814364777" },
  { complaintId: "AC0611AC158", phoneNumber: "7977202025" },
  { complaintId: "AC0611AC431", phoneNumber: "9053716414" },
  { complaintId: "AC0711AC273", phoneNumber: "9932482618" },
  { complaintId: "AC1011AC405", phoneNumber: "9855167972" },
  { complaintId: "AC1011AC437", phoneNumber: "7004457723" },
  { complaintId: "AC1211AC880", phoneNumber: "7042893524" },
  { complaintId: "AC1911JE756", phoneNumber: "7894446160" }
];

async function reopenCanceledComplaints() {
  try {
    console.log("Searching for CANCELED complaints from 25 October...");

    const phoneNumbers = reopenList.map(c => c.phoneNumber);
    const startDate = new Date("2025-10-25T00:00:00.000Z");

    // Step 1: Find canceled complaints from startDate
    const canceledComplaints = await ComplaintModal.find({
      phoneNumber: { $in: phoneNumbers },
      status: "CANCELED",
      createdAt: { $gte: startDate }
    });

    console.log(`Found ${canceledComplaints.length} canceled complaints:`);

    canceledComplaints.forEach(c => {
      console.log(`ComplaintID: ${c.complaintId}, Phone: ${c.phoneNumber}`);
    });

    // Step 2: Reopen complaints
    for (const complaint of canceledComplaints) {
      console.log(`\nProcessing ComplaintID: ${complaint.complaintId}`);

      // Reverse updateHistory
      const reversedHistory = [...complaint.updateHistory].reverse();

      // Debug log
      console.log("Full updateHistory reversed:");
      reversedHistory.forEach((h, idx) => {
        if (h.changes instanceof Map) {
          console.log(
            idx,
            "Status:", h.changes.get("status") ?? "undefined",
            "| Comments:", h.changes.get("comments") ?? "undefined"
          );
        } else {
          console.log(
            idx,
            "Status:", h.changes?.status ?? "undefined",
            "| Comments:", h.changes?.comments ?? "undefined"
          );
        }
      });

      // Step 4a: Find previous status before last CANCELED
      const lastCancelIndex = reversedHistory.findIndex(h => {
        if (h.changes instanceof Map) {
          return h.changes.get("status") === "CANCELED";
        } else {
          return h.changes?.status === "CANCELED";
        }
      });

      let previousStatus;
      if (lastCancelIndex >= 0 && lastCancelIndex + 1 < reversedHistory.length) {
        const prevEntry = reversedHistory[lastCancelIndex + 1];
        if (prevEntry.changes instanceof Map) {
          previousStatus = prevEntry.changes.get("status");
        } else {
          previousStatus = prevEntry.changes?.status;
        }
        console.log(`Step 4b: Previous status found in history: ${previousStatus}`);
      } else {
        previousStatus = "INPROGRESS"; // default if not found
        console.log(`Step 4b: No previous status found. Using default: ${previousStatus}`);
      }

      // Step 5: Update complaint status and push to history
      complaint.status = previousStatus;
      complaint.updateHistory.push({
        updatedAt: new Date(),
        changes: {
          status: previousStatus,
          comments: "Brand wants to reopen this case",
          empId: "system",
          empName: "Servsy"
        }
      });

      // Debug the updated complaint before saving
      console.log(`Complaint ${complaint.complaintId} reopened to status: ${complaint.status}`);
      console.log("Latest history entry:", complaint.updateHistory[complaint.updateHistory.length - 1]);

      // Step 6: Save the complaint
      await complaint.save(); // Uncomment to actually save
    }
console.log(`Found ${canceledComplaints.length} canceled complaints:`);
    console.log("All eligible canceled complaints have been processed.");

  } catch (error) {
    console.error("Error in reopenCanceledComplaints:", error);
  }
}



// reopenCanceledComplaints();





