

const cron = require("node-cron");
const ComplaintModal = require("./models/complaint");
const { ServiceModel } = require("./models/registration");
const mongoose = require("mongoose");

console.log("✅ Cron job scheduler initialized...");
const { admin } = require('../src/firebase/index')
// Run every 60 minutes
cron.schedule("0 * * * *", async () => {
   console.log("🔄 Running scheduled task to assign service centers...");

   try {
      // Fetch pending complaints older than 2 minutes
      const pendingComplaints = await ComplaintModal.find({
         status: "PENDING",
         createdAt: { $lte: new Date(Date.now() - 60 * 60 * 1000) }
      });

      console.log(`🟢 Found ${pendingComplaints.length} pending complaints`);

      for (let complaint of pendingComplaints) {
         // console.log("\n📝 Complaint Details:");
         // console.log(`Complaint ID: ${complaint._id}`);
         // console.log(`Pincode: ${complaint.pincode}`);
         // console.log(`Brand ID: ${complaint.brandId}`);
         // console.log(`Created At: ${complaint.createdAt}`);



         //  let serviceCenter = await ServiceModel.findOne({
         //     $and: [
         //        {
         //           $or: [
         //              { postalCode: complaint.pincode },
         //              { pincodeSupported: { $in: [complaint.pincode] } }
         //           ]
         //        },
         //        { "brandsSupported.value": complaint.brandId.toString() } // Ensure it's a string match
         //     ]
         //  });
         let serviceCenter = await ServiceModel.findOne({
            $and: [
               {
                  $or: [
                     { postalCode: complaint.pincode },
                     { pincodeSupported: { $in: [complaint.pincode] } }
                  ]
               },
               { brandsSupported: { $elemMatch: { value: complaint.brandId.toString() } } }
            ]
         });

         if (serviceCenter) {
            console.log("🏢 Service Center Found:");
            // console.log(`Service Center ID: ${serviceCenter._id}`);
            // console.log(`Name: ${serviceCenter.serviceCenterName}`);
            // console.log(`Contact: ${serviceCenter.contact}`);
            let changes = {
               assignServiceCenterId: serviceCenter._id,
               assignServiceCenter: serviceCenter.serviceCenterName,
               serviceCenterContact: serviceCenter.contact,
               status: "ASSIGN",
               autoAssign: "Yes" // Additional field tracking auto-assignment
           };

            await ComplaintModal.findByIdAndUpdate(complaint._id, {
               assignServiceCenterId: serviceCenter._id,
               assignServiceCenter: serviceCenter.serviceCenterName,
               serviceCenterContact: serviceCenter.contact,
               status: "ASSIGN",
               $push: {
                  updateHistory: {
                      updatedAt: Date.now(), // Using Date.now() for consistency
                      changes,
                  }
               }
            });


            await sendNotification(
               serviceCenter._id,  // Use serviceCenter._id instead of complaint.assignServiceCenterId
               `Assign Complaint`,
               `You have been assigned a new complaint (ID: ${complaint.complaintId}). Please review the details and take the necessary action.`
            );

            console.log(`✅ Assigned Service Center to Complaint ${complaint._id}`);
         } else {
            console.log(`⚠️ No service center found for complaint ${complaint._id}`);
         }
      }
   } catch (error) {
      console.error("❌ Error in assigning service center:", error);
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
