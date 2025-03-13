 

const cron = require("node-cron");
const ComplaintModal = require("./models/complaint");
const { ServiceModel } = require("./models/registration");
const mongoose = require("mongoose");

console.log("✅ Cron job scheduler initialized...");

// Run every 2 minutes
cron.schedule("*/2 * * * *", async () => {  
   console.log("🔄 Running scheduled task to assign service centers...");

   try {
      // Fetch pending complaints older than 2 minutes
      const pendingComplaints = await ComplaintModal.find({
         status: "PENDING",
         createdAt: { $lte: new Date(Date.now() - 60 * 60 * 1000) }
      });

      console.log(`🟢 Found ${pendingComplaints.length} pending complaints`);

      for (let complaint of pendingComplaints) {
         console.log("\n📝 Complaint Details:");
         console.log(`Complaint ID: ${complaint._id}`);
         console.log(`Pincode: ${complaint.pincode}`);
         console.log(`Brand ID: ${complaint.brandId}`);
         console.log(`Created At: ${complaint.createdAt}`);

        

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
            console.log(`Service Center ID: ${serviceCenter._id}`);
            console.log(`Name: ${serviceCenter.serviceCenterName}`);
            console.log(`Contact: ${serviceCenter.contact}`);

            await ComplaintModal.findByIdAndUpdate(complaint._id, {
               assignServiceCenterId: serviceCenter._id,
               assignServiceCenter: serviceCenter.serviceCenterName,
               serviceCenterContact: serviceCenter.contact,
               status: "ASSIGN"
            });

            console.log(`✅ Assigned Service Center to Complaint ${complaint._id}`);
         } else {
            console.log(`⚠️ No service center found for complaint ${complaint._id}`);
         }
      }
   } catch (error) {
      console.error("❌ Error in assigning service center:", error);
   }
});
