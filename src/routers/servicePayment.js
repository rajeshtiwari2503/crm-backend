const express = require("express");
const router = express.Router();
const { upload } = require("../services/service");
const ServicePaymentModel = require("../models/servicePaymentModel")
const { ServiceModel } = require('../models/registration');
const ComplaintModal = require("../models/complaint");

const { addServicePayment, getAllServicePayment, getAllServicePaymentByCenterId, getServicePaymentById, updateBulkPayments, editServicePayment, deleteServicePayment } = require("../controllers/servicePaymentController")

// router.post("/addServicePayment",addServicePayment );
router.post("/addServicePayment", upload().single("qrCode"), addServicePayment);
router.get("/getAllServicePayment", getAllServicePayment);
router.get("/getAllServicePaymentByCenterId/:id", getAllServicePaymentByCenterId);
router.get("/getServicePayment/:id", getServicePaymentById);
// router.patch("/editServicePayment/:id",editServicePayment );
router.patch("/editServicePayment/:id", upload().single("payScreenshot"), editServicePayment);
router.delete("/deleteServicePayment/:id", deleteServicePayment);

router.put('/updateBulkPayments', updateBulkPayments);




router.post('/addDeliveryChargePayment', async (req, res) => {
  try {
    const newPayment = new ServicePaymentModel(req.body);
    const saved = await newPayment.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// router.get("/wallet-payment-summary", async (req, res) => {
//   try {
//     const now = new Date();

//     // Service payments = current month
//     const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
//     const currentMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

//     // Complaints = previous month
//     const previousMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
//     const previousMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

//     console.log("🟩 Service Payment Date Range:", currentMonthStart, "→", currentMonthEnd);
//     console.log("🟨 Complaint Date Range:", previousMonthStart, "→", previousMonthEnd);

//     // 📌 Step 1: Aggregate Payments for Current Month
//     const payments = await ServicePaymentModel.aggregate([
//       {
//         $match: {
//           createdAt: { $gte: currentMonthStart, $lt: currentMonthEnd }
//         }
//       },
//       {
//         $group: {
//           _id: "$serviceCenterId",
//           name: { $first: "$serviceCenterName" },
//           totalAmount: {
//             $sum: { $toDouble: "$payment" }
//           },
//           unpaidCount: {
//             $sum: {
//               $cond: [{ $eq: ["$status", "UNPAID"] }, 1, 0]
//             }
//           },
//           paidCount: {
//             $sum: {
//               $cond: [{ $eq: ["$status", "PAID"] }, 1, 0]
//             }
//           }
//         }
//       },
//       {
//         $sort: { totalAmount: -1 }
//       }
//     ]);

//     console.log("✅ Payments Summary:", payments);

//     // 📌 Step 2: Find Complaints from Previous Month
//     const complaints = await ComplaintModal.find({
//       createdAt: { $gte: previousMonthStart, $lt: previousMonthEnd },
//       closedAt: { $ne: null }
//     }).lean();

//     console.log("🧾 Complaints Count:", complaints.length);

//     const tatBuckets = {
//       "1-2": 0,
//       "2-3": 0,
//       "3-5": 0,
//       ">5": 0
//     };

//     complaints.forEach(comp => {
//       const tatDays = Math.ceil(
//         (new Date(comp.closedAt) - new Date(comp.createdAt)) / (1000 * 60 * 60 * 24)
//       );

//       if (tatDays <= 2) tatBuckets["1-2"]++;
//       else if (tatDays <= 3) tatBuckets["2-3"]++;
//       else if (tatDays <= 5) tatBuckets["3-5"]++;
//       else tatBuckets[">5"]++;
//     });

//     console.log("📊 TAT Report:", tatBuckets);

//     // 📌 Final Response
//     return res.json({
//       summary: payments,
//       tatReport: tatBuckets
//     });

//   } catch (err) {
//     console.error("❌ Error in /wallet-payment-summary:", err);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// });


// router.get("/wallet-payment-summary", async (req, res) => {
//   try {
//     // 1. Extract query params
//     const { month, year, sortBy } = req.query;
// console.log("req.query",req.query);

//     // 2. Validate and set filter month/year, default to current
//     const now = new Date();
//     const filterMonth = month ? parseInt(month) - 1 : now.getMonth(); // JS month 0-based
//     const filterYear = year ? parseInt(year) : now.getFullYear();

//     // 3. Define current month date range for payments in UTC
//     const currentMonthStart = new Date(Date.UTC(filterYear, filterMonth, 1));
//     const currentMonthEnd = new Date(Date.UTC(filterYear, filterMonth + 1, 1));

//     // 4. Define previous month date range for complaints in UTC
//     let prevMonth = filterMonth - 1;
//     let prevYear = filterYear;
//     if (prevMonth < 0) {
//       prevMonth = 11;
//       prevYear--;
//     }
//     const previousMonthStart = new Date(Date.UTC(prevYear, prevMonth, 1));
//     const previousMonthEnd = new Date(Date.UTC(filterYear, filterMonth, 1));

//     // Debug print ranges
//     console.log("🟩 Service Payment Date Range:", currentMonthStart.toISOString(), "→", currentMonthEnd.toISOString());
//     console.log("🟨 Complaint Date Range:", previousMonthStart.toISOString(), "→", previousMonthEnd.toISOString());

//     // 5. Aggregate payments in current month
//     const payments = await ServicePaymentModel.aggregate([
//       {
//         $match: {
//           createdAt: { $gte: currentMonthStart, $lt: currentMonthEnd },
//         },
//       },
//       {
//         $group: {
//           _id: "$serviceCenterId",
//           name: { $first: "$serviceCenterName" },
//           totalAmount: { $sum: { $toDouble: "$payment" } },
//           unpaidCount: { $sum: { $cond: [{ $eq: ["$status", "UNPAID"] }, 1, 0] } },
//           paidCount: { $sum: { $cond: [{ $eq: ["$status", "PAID"] }, 1, 0] } },
//           totalPayments: { $sum: 1 },
//           complaintIds: { $addToSet: "$complaintId" }, // optional if needed
//         },
//       },
//     ]);

//     console.log("🟦 Payments aggregation result count:", payments.length);

//     // 6. Aggregate complaints in previous month (only closed ones)
//     const complaints = await ComplaintModal.aggregate([
//       {
//         $match: {
//           createdAt: { $gte: previousMonthStart, $lt: previousMonthEnd },
//           closedAt: { $ne: null },
//         },
//       },
//       {
//         $group: {
//           _id: "$assignServiceCenterId",
//           complaintCount: { $sum: 1 },
//           complaints: { $push: { createdAt: "$createdAt", closedAt: "$closedAt" } },
//         },
//       },
//     ]);

//     console.log("🟨 Complaints aggregation result count:", complaints.length);

//     // 7. Create a map for quick lookup complaints by serviceCenterId
//     const complaintsMap = {};
//     complaints.forEach(c => {
//       complaintsMap[c._id.toString()] = c;
//     });

//     // 8. Calculate TAT buckets per service center
//     const tatBucketsByServiceCenter = {};
//     complaints.forEach(({ _id, complaints }) => {
//       const buckets = { "1-2": 0, "2-3": 0, "3-5": 0, ">5": 0 };
//       complaints.forEach(comp => {
//         const tatDays = Math.ceil((new Date(comp.closedAt) - new Date(comp.createdAt)) / (1000 * 60 * 60 * 24));
//         if (tatDays <= 2) buckets["1-2"]++;
//         else if (tatDays <= 3) buckets["2-3"]++;
//         else if (tatDays <= 5) buckets["3-5"]++;
//         else buckets[">5"]++;
//       });
//       tatBucketsByServiceCenter[_id.toString()] = buckets;
//     });

//     // 9. Merge payments and complaints data and calculate analytics
//     let summary = payments.map(payment => {
//       const compData = complaintsMap[payment._id.toString()] || { complaintCount: 0 };
//       const complaintCount = compData.complaintCount || 0;

//       return {
//         _id: payment._id,
//         name: payment.name,
//         totalAmount: payment.totalAmount,
//         unpaidCount: payment.unpaidCount,
//         paidCount: payment.paidCount,
//         totalComplaints: complaintCount,
//         averagePaymentPerComplaint: complaintCount > 0 ? payment.totalAmount / complaintCount : 0,
//         percentageUnpaid: payment.totalPayments > 0 ? (payment.unpaidCount / payment.totalPayments) * 100 : 0,
//         percentagePaid: payment.totalPayments > 0 ? (payment.paidCount / payment.totalPayments) * 100 : 0,
//         tatReport: tatBucketsByServiceCenter[payment._id.toString()] || { "1-2": 0, "2-3": 0, "3-5": 0, ">5": 0 },
//       };
//     });

//     // 10. Add service centers with complaints but no payments
//     complaints.forEach(c => {
//       if (!summary.find(s => s._id.toString() === c._id.toString())) {
//         summary.push({
//           _id: c._id,
//           name: null,
//           totalAmount: 0,
//           unpaidCount: 0,
//           paidCount: 0,
//           totalComplaints: c.complaintCount,
//           averagePaymentPerComplaint: 0,
//           percentageUnpaid: 0,
//           percentagePaid: 0,
//           tatReport: tatBucketsByServiceCenter[c._id.toString()],
//         });
//       }
//     });

//     console.log("🟪 Final summary count:", summary.length);

//     // 11. Sorting summary based on query param
// if (sortBy === "high") {
//   // Sort descending by totalAmount
//   summary = summary.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
// } else if (sortBy === "low") {
//   // Sort ascending by totalAmount
//   summary = summary.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
// } else {
//   // Default alpha sort by name (nulls last)
//   summary = summary.sort((a, b) => {
//     if (!a.name && !b.name) return 0;
//     if (!a.name) return 1;
//     if (!b.name) return -1;
//     return a.name.localeCompare(b.name);
//   });
// }

//     // 12. Return response
//     return res.json({ summary });

//   } catch (err) {
//     console.error("❌ Error in /wallet-payment-summary:", err);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// });


// Assuming you already have these imported somewhere:
// const express = require('express');
// const router = express.Router();
// const ServicePaymentModel = require('path_to_ServicePaymentModel');
// const ComplaintModal = require('path_to_ComplaintModal');

router.get("/wallet-payment-summary", async (req, res) => {
  try {
    const { month, year, sortBy } = req.query;
    // console.log("req.query:", req.query);

    const now = new Date();
    const filterMonth = month ? parseInt(month) - 1 : now.getMonth();
    const filterYear = year ? parseInt(year) : now.getFullYear();

    const currentMonthStart = new Date(Date.UTC(filterYear, filterMonth, 1));
    const currentMonthEnd = new Date(Date.UTC(filterYear, filterMonth + 1, 1));

    // Step 1: Aggregate payments by serviceCenterId in current month
    const payments = await ServicePaymentModel.aggregate([
      {
        $match: {
          createdAt: { $gte: currentMonthStart, $lt: currentMonthEnd },
        },
      },
      {
       
        $group: {
          _id: "$serviceCenterId",
          name: { $first: "$serviceCenterName" },
          totalAmount: {
            $sum: {
              $convert: {
                input: { $trim: { input: "$payment" } },
                to: "double",
                onError: 0,
                onNull: 0,
              },
            },
          },
          unpaidCount: { $sum: { $cond: [{ $eq: ["$status", "UNPAID"] }, 1, 0] } },
          paidCount: { $sum: { $cond: [{ $eq: ["$status", "PAID"] }, 1, 0] } },
          totalPayments: { $sum: 1 },
          complaintIds: { $addToSet: "$complaintId" },
        }

      },
    ]);

    console.log("🟦 Payments aggregation result count:", payments.length);

    // Step 2: Extract all unique complaint IDs from payments
    const allComplaintIds = payments.reduce((acc, p) => {
      return acc.concat(p.complaintIds || []);
    }, []);
    const uniqueComplaintIds = [...new Set(allComplaintIds)];

    if (uniqueComplaintIds.length === 0) {
      // No complaints related, send payments summary with empty complaints info
      const summary = payments.map(payment => ({
        _id: payment._id,
        name: payment.name,
        totalAmount: payment.totalAmount,
        unpaidCount: payment.unpaidCount,
        paidCount: payment.paidCount,
        totalComplaints: 0,
        averagePaymentPerComplaint: 0,
        percentageUnpaid: payment.totalPayments > 0 ? (payment.unpaidCount / payment.totalPayments) * 100 : 0,
        percentagePaid: payment.totalPayments > 0 ? (payment.paidCount / payment.totalPayments) * 100 : 0,
        tatReport: { "1-2": 0, "2-3": 0, "3-5": 0, ">5": 0 },
      }));

      return res.json({ summary });
    }

    // Step 3: Fetch complaints by those IDs and having valid times for TAT calc
    const complaints = await ComplaintModal.find({
      _id: { $in: uniqueComplaintIds },
      assignServiceCenterTime: { $ne: null },
      complaintCloseTime: { $ne: null },
    }).lean();

    // Step 4: Group complaints by service center ID
    const complaintsByServiceCenter = {};
    complaints.forEach(c => {
      const scId = c.assignServiceCenterId?.toString();
      if (!scId) return; // skip if no service center assigned
      if (!complaintsByServiceCenter[scId]) {
        complaintsByServiceCenter[scId] = [];
      }
      complaintsByServiceCenter[scId].push(c);
    });

    // Step 5: Calculate TAT buckets per service center
    const tatBucketsByServiceCenter = {};

    for (const [scId, comps] of Object.entries(complaintsByServiceCenter)) {
      const buckets = {
        "0": 0,
        "1": 0,
        "1-2": 0,
        "2-3": 0,
        "3-4": 0,
        "4-5": 0,
        ">5": 0,
      };

      comps.forEach(c => {
        const tatMs = new Date(c.complaintCloseTime) - new Date(c.assignServiceCenterTime);
        const tatDays = Math.ceil(tatMs / (1000 * 60 * 60 * 24));

        if (tatDays === 0) {
          buckets["0"]++;
        } else if (tatDays === 1) {
          buckets["1"]++;
        } else if (tatDays === 2) {
          buckets["1-2"]++;
        } else if (tatDays === 3) {
          buckets["2-3"]++;
        } else if (tatDays === 4) {
          buckets["3-4"]++;
        } else if (tatDays === 5) {
          buckets["4-5"]++;
        } else {
          buckets[">5"]++;
        }
      });

      tatBucketsByServiceCenter[scId] = buckets;
    }



    // Step 6: Build summary merging payments and complaints info
    const summary = payments.map(payment => {
      const scId = payment._id.toString();
      const comps = complaintsByServiceCenter[scId] || [];
      const complaintCount = comps.length;

      return {
        _id: payment._id,
        name: payment.name,
        totalAmount: payment.totalAmount,
        unpaidCount: payment.unpaidCount,
        paidCount: payment.paidCount,
        totalComplaints: complaintCount,
        averagePaymentPerComplaint: complaintCount > 0 ? payment.totalAmount / complaintCount : 0,
        percentageUnpaid: payment.totalPayments > 0 ? (payment.unpaidCount / payment.totalPayments) * 100 : 0,
        percentagePaid: payment.totalPayments > 0 ? (payment.paidCount / payment.totalPayments) * 100 : 0,
        tatReport: tatBucketsByServiceCenter[scId] || { "1-2": 0, "2-3": 0, "3-5": 0, ">5": 0 },
      };
    });

    // Optional: Sort summary based on query param
    if (sortBy === "high") {
      summary.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    } else if (sortBy === "low") {
      summary.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
    } else {
      summary.sort((a, b) => {
        if (!a.name && !b.name) return 0;
        if (!a.name) return 1;
        if (!b.name) return -1;
        return a.name.localeCompare(b.name);
      });
    }

    res.json({ summary });
  } catch (err) {
    console.error("❌ Error in /wallet-payment-summary:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});










module.exports = router;