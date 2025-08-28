
// const cron = require("node-cron");
// const fs = require("fs");
// const path = require("path");
// const ComplaintModal = require("../models/complaint");
// const { sendReportEmail } = require("../utils/mailer");
// const { generatePendingComplaintsExcel } = require("../utils/excelHelper");
// const { BrandRegistrationModel, ServiceModel } = require("../models/registration");



// // Reports folder path
// const reportsDir = path.join(process.cwd(), "backend", "reports");
// if (!fs.existsSync(reportsDir)) {
//     fs.mkdirSync(reportsDir, { recursive: true });
// }

// cron.schedule("22 11 * * *", async () => {
//     console.log("⏰ Running Daily Pending Complaints Report Job...");

//     try {
//         // 1. Get pending complaints from MongoDB
//         // const pendingComplaints = await ComplaintModal.find({ status: "PENDING" });
//         const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }).select("_id");
//         const activeBrandIds = activeBrands.map(brand => brand._id);
//         const pendingComplaints = await ComplaintModal.find({
//             status: { $nin: ["FINAL VERIFICATION", "COMPLETED", "CANCELED"] },
//             brandId: { $in: activeBrandIds }
//         });

//         // preload all brands & service centers into a map
//         const brands = await BrandRegistrationModel.find({});
//         const services = await ServiceModel.find({});

//         const brandMap = Object.fromEntries(brands.map(b => [b._id.toString(), b]));
//         const serviceMap = Object.fromEntries(services.map(s => [s._id.toString(), s]));

//         // ✅ Initialize groupedData
//         const groupedData = {};

//         pendingComplaints.forEach((c) => {
//             const brand = brandMap[c.brandId?.toString()];
//             const service = serviceMap[c.assignServiceCenterId?.toString()];
//             // console.log("✅ brand", brand);
//             // console.log("✅ service", service);
//             // const email = service?.email || brand?.email;
//             const email = "rajeshtiwari2503@gmail.com";
//             if (!email) return;

//             if (!groupedData[email]) groupedData[email] = [];

//             groupedData[email].push({
//                 complaintId: c.complaintId,
//                 customerName: c.fullName || c.userName,
//                 product: c.productName,
//                 status: c.status,
//                 assignedTo: c?.assignServiceCenter || "N/A",
//                 createdAt: c.createdAt.toISOString(),
//             });
//         });

//         // console.log("✅ Pending Complaints:", pendingComplaints);
//         // console.log("✅ Grouped Data:", groupedData);
//         console.log("✅ Grouped DatapendingComplaints:", pendingComplaints.length);

//         // 3. Generate and send per recipient
//         for (const email in groupedData) {
//             const filePath = path.join(
//                 reportsDir,
//                 `PendingComplaints_${Date.now()}.xlsx`
//             );

//             await generatePendingComplaintsExcel(groupedData[email], filePath);
//             // await sendReportEmail(email, filePath);

//             // Optionally delete file
//             fs.unlinkSync(filePath);
//         }

//         console.log("✅ Daily reports sent successfully");
//     } catch (err) {
//         console.error("❌ Error generating reports:", err);
//     }
// });

const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const ComplaintModal = require("../models/complaint");
const { sendReportEmail } = require("../utils/mailer");
const { generatePendingComplaintsExcel } = require("../utils/excelHelper");
const { BrandRegistrationModel, ServiceModel } = require("../models/registration");

// ✅ Reports folder path (Vercel-safe: use /tmp)
const reportsDir = path.join("/tmp", "reports");
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

cron.schedule("40 11 * * *", async () => {
    console.log("⏰ Running Daily Pending Complaints Report Job...");

    try {
        // 1. Get active brands
        const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }).select("_id");
        const activeBrandIds = activeBrands.map(brand => brand._id);

        // 2. Get complaints except FINAL VERIFICATION, COMPLETED, CANCELED
        const pendingComplaints = await ComplaintModal.find({
            status: { $nin: ["FINAL VERIFICATION", "COMPLETED", "CANCELED"] },
            brandId: { $in: activeBrandIds }
        });

        // preload all brands & service centers into a map
        const brands = await BrandRegistrationModel.find({});
        const services = await ServiceModel.find({});

        const brandMap = Object.fromEntries(brands.map(b => [b._id.toString(), b]));
        const serviceMap = Object.fromEntries(services.map(s => [s._id.toString(), s]));

        // ✅ Initialize groupedData
        const groupedData = {};

        pendingComplaints.forEach((c) => {
            const brand = brandMap[c.brandId?.toString()];
            const service = serviceMap[c.assignServiceCenterId?.toString()];
            // const email = service?.email || brand?.email;
            const email = "rajeshtiwari2503@gmail.com"; // test email
            if (!email) return;

            if (!groupedData[email]) groupedData[email] = [];

            groupedData[email].push({
                complaintId: c.complaintId,
                customerName: c.fullName || c.userName,
                product: c.productName,
                status: c.status,
                assignedTo: c?.assignServiceCenter || "N/A",
                createdAt: c.createdAt.toISOString(),
            });
        });

        console.log("✅ Complaints count:", pendingComplaints.length);

        // 3. Generate and send per recipient
        for (const email in groupedData) {
            const filePath = path.join(
                reportsDir,
                `PendingComplaints_${Date.now()}.xlsx`
            );

            await generatePendingComplaintsExcel(groupedData[email], filePath);

            try {
                await sendReportEmail(email, filePath);
                console.log(`📧 Report sent to ${email}`);

                // ✅ Delete file only after successful send
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️ Deleted report file: ${filePath}`);
                }
                 
            } catch (err) {
                console.error(`❌ Failed to send email to ${email}:`, err);
                // ⚠️ Do not delete file if send fails (can debug manually)
            }
        }

        console.log("✅ Daily reports job finished successfully");
    } catch (err) {
        console.error("❌ Error generating reports:", err);
    }
});
