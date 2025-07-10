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
//     const { month, year, sortBy } = req.query;
//     // console.log("req.query:", req.query);

//     const now = new Date();
//     const filterMonth = month ? parseInt(month) - 1 : now.getMonth();
//     const filterYear = year ? parseInt(year) : now.getFullYear();

//     const currentMonthStart = new Date(Date.UTC(filterYear, filterMonth, 1));
//     const currentMonthEnd = new Date(Date.UTC(filterYear, filterMonth + 1, 1));

//     // Step 1: Aggregate payments by serviceCenterId in current month
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
//           contactNo: { $first: "$contactNo" },
//           totalAmount: {
//             $sum: {
//               $convert: {
//                 input: { $trim: { input: "$payment" } },
//                 to: "double",
//                 onError: 0,
//                 onNull: 0,
//               },
//             },
//           },
//           unpaidCount: { $sum: { $cond: [{ $eq: ["$status", "UNPAID"] }, 1, 0] } },
//           paidCount: { $sum: { $cond: [{ $eq: ["$status", "PAID"] }, 1, 0] } },
//           totalPayments: { $sum: 1 },
//           complaintIds: { $addToSet: "$complaintId" },
//         }

//       },
//     ]);

//     // console.log("🟦 Payments aggregation result count:", payments.length);

//     // Step 2: Extract all unique complaint IDs from payments
//     const allComplaintIds = payments.reduce((acc, p) => {
//       return acc.concat(p.complaintIds || []);
//     }, []);
//     const uniqueComplaintIds = [...new Set(allComplaintIds)];

//     if (uniqueComplaintIds.length === 0) {
//       // No complaints related, send payments summary with empty complaints info
//       const summary = payments.map(payment => ({
//         _id: payment._id,
//         name: payment.name,
//         contactNo: payment.contactNo,
//         totalAmount: payment.totalAmount,
//         unpaidCount: payment.unpaidCount,
//         paidCount: payment.paidCount,
//         totalComplaints: 0,
//         averagePaymentPerComplaint: 0,
//         percentageUnpaid: payment.totalPayments > 0 ? (payment.unpaidCount / payment.totalPayments) * 100 : 0,
//         percentagePaid: payment.totalPayments > 0 ? (payment.paidCount / payment.totalPayments) * 100 : 0,
//         tatReport: { "1-2": 0, "2-3": 0, "3-5": 0, ">5": 0 },
//       }));

//       return res.json({ summary });
//     }

//     // Step 3: Fetch complaints by those IDs and having valid times for TAT calc
//     const complaints = await ComplaintModal.find({
//       _id: { $in: uniqueComplaintIds },
//       assignServiceCenterTime: { $ne: null },
//       complaintCloseTime: { $ne: null },
//     }).lean();

//     // Step 4: Group complaints by service center ID
//     const complaintsByServiceCenter = {};
//     complaints.forEach(c => {
//       const scId = c.assignServiceCenterId?.toString();
//       if (!scId) return; // skip if no service center assigned
//       if (!complaintsByServiceCenter[scId]) {
//         complaintsByServiceCenter[scId] = [];
//       }
//       complaintsByServiceCenter[scId].push(c);
//     });

//     // Step 5: Calculate TAT buckets per service center
//     const tatBucketsByServiceCenter = {};

//     for (const [scId, comps] of Object.entries(complaintsByServiceCenter)) {
//       const buckets = {
//         "0": 0,
//         "1": 0,
//         "1-2": 0,
//         "2-3": 0,
//         "3-4": 0,
//         "4-5": 0,
//         ">5": 0,
//       };

//       comps.forEach(c => {
//         const tatMs = new Date(c.complaintCloseTime) - new Date(c.assignServiceCenterTime);
//         const tatDays = Math.ceil(tatMs / (1000 * 60 * 60 * 24));

//         if (tatDays === 0) {
//           buckets["0"]++;
//         } else if (tatDays === 1) {
//           buckets["1"]++;
//         } else if (tatDays === 2) {
//           buckets["1-2"]++;
//         } else if (tatDays === 3) {
//           buckets["2-3"]++;
//         } else if (tatDays === 4) {
//           buckets["3-4"]++;
//         } else if (tatDays === 5) {
//           buckets["4-5"]++;
//         } else {
//           buckets[">5"]++;
//         }
//       });

//       tatBucketsByServiceCenter[scId] = buckets;
//     }



//     // Step 6: Build summary merging payments and complaints info
//     const summary = payments.map(payment => {
//       // console.log("payment",payment);

//       const scId = payment._id.toString();
//       const comps = complaintsByServiceCenter[scId] || [];
//       const complaintCount = comps.length;

//       return {
//         _id: payment._id,
//         name: payment.name,
//          contactNo: payment.contactNo,
//         totalAmount: payment.totalAmount,
//         unpaidCount: payment.unpaidCount,
//         paidCount: payment.paidCount,
//         totalComplaints: complaintCount,
//         averagePaymentPerComplaint: complaintCount > 0 ? payment.totalAmount / complaintCount : 0,
//         percentageUnpaid: payment.totalPayments > 0 ? (payment.unpaidCount / payment.totalPayments) * 100 : 0,
//         percentagePaid: payment.totalPayments > 0 ? (payment.paidCount / payment.totalPayments) * 100 : 0,
//         tatReport: tatBucketsByServiceCenter[scId] || { "1-2": 0, "2-3": 0, "3-5": 0, ">5": 0 },
//       };
//     });

//     // Optional: Sort summary based on query param
//     if (sortBy === "high") {
//       summary.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
//     } else if (sortBy === "low") {
//       summary.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
//     } else {
//       summary.sort((a, b) => {
//         if (!a.name && !b.name) return 0;
//         if (!a.name) return 1;
//         if (!b.name) return -1;
//         return a.name.localeCompare(b.name);
//       });
//     }

//     res.json({ summary });
//   } catch (err) {
//     console.error("❌ Error in /wallet-payment-summary:", err);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// });

// ✅ FULL FIXED API: /wallet-payment-summary

router.get("/wallet-payment-summary", async (req, res) => {
  try {
    const { month, year, sortBy } = req.query;

    const now = new Date();
    const filterMonth = month ? parseInt(month) - 1 : now.getMonth();
    const filterYear = year ? parseInt(year) : now.getFullYear();

    const currentMonthStart = new Date(Date.UTC(filterYear, filterMonth, 1));
    const currentMonthEnd = new Date(Date.UTC(filterYear, filterMonth + 1, 1));

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
          contactNo: { $first: "$contactNo" },
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
          unpaidCount: {
            $sum: { $cond: [{ $eq: ["$status", "UNPAID"] }, 1, 0] },
          },
          paidCount: {
            $sum: { $cond: [{ $eq: ["$status", "PAID"] }, 1, 0] },
          },
          totalPayments: { $sum: 1 },
          complaintIds: {
            $addToSet: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$complaintId", null] },
                    { $ne: ["$complaintId", ""] },
                  ],
                },
                "$complaintId",
                null,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "servicepayments",
          let: { scId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$serviceCenterId", "$$scId"] },
                    { $ne: ["$complaintId", null] },
                    { $ne: ["$complaintId", ""] },
                  ],
                },
                createdAt: { $gte: currentMonthStart, $lt: currentMonthEnd },
              },
            },
            {
              $addFields: {
                paymentDouble: {
                  $convert: {
                    input: { $trim: { input: "$payment" } },
                    to: "double",
                    onError: 0,
                    onNull: 0,
                  },
                },
              },
            },

            {
              $group: {
                _id: "$complaintId",
                count: { $sum: 1 },
                totalPayment: { $sum: "$paymentDouble" },
              },
            },
            {
              $match: {
                count: { $gt: 1 },
              },
            },
            {
              $lookup: {
                from: "servicepayments",
                let: { ids: ["$_id"], scId: "$$scId" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$serviceCenterId", "$$scId"] },
                          { $in: ["$complaintId", "$$ids"] },
                        ],
                      },
                      createdAt: { $gte: currentMonthStart, $lt: currentMonthEnd },
                    },
                  },
                  {
                    $addFields: {
                      payment: {
                        $convert: {
                          input: { $trim: { input: "$payment" } },
                          to: "double",
                          onError: 0,
                          onNull: 0,
                        },
                      },
                    },
                  },
                  {
                    $project: {
                      complaintId: 1,
                      payment: 1,
                    },
                  },
                ],
                as: "duplicatePayments",
              },
            },
            {
              $project: {
                _id: 0,
                duplicateComplaintDetails: {
                  $concatArrays: [
                    "$duplicatePayments",
                    [
                      {
                        complaintId: "$_id",
                        totalPayment: "$totalPayment",
                        count: "$count",
                      },
                    ],
                  ],
                },
              },
            },
          ],
          as: "duplicateComplaintInfo",
        },
      },
      {
        $addFields: {
          duplicateComplaintDetails: {
            $ifNull: [
              { $arrayElemAt: ["$duplicateComplaintInfo.duplicateComplaintDetails", 0] },
              [],
            ],
          },
        },
      },
    ]);

    // Fetch valid complaints
    const allComplaintIds = payments.reduce((acc, p) => acc.concat(p.complaintIds || []), []);
    const uniqueComplaintIds = [...new Set(allComplaintIds.filter(Boolean))];

    const complaints = uniqueComplaintIds.length > 0
      ? await ComplaintModal.find({
        _id: { $in: uniqueComplaintIds },
        assignServiceCenterTime: { $ne: null },
        complaintCloseTime: { $ne: null },
      }).lean()
      : [];

    // Group by service center
    const complaintsByServiceCenter = {};
    complaints.forEach((c) => {
      const scId = c.assignServiceCenterId?.toString();
      if (!scId) return;
      if (!complaintsByServiceCenter[scId]) {
        complaintsByServiceCenter[scId] = [];
      }
      complaintsByServiceCenter[scId].push(c);
    });

    // TAT calculation
    const tatBucketsByServiceCenter = {};
    for (const [scId, comps] of Object.entries(complaintsByServiceCenter)) {
      const buckets = {
        "0": 0, "1": 0, "1-2": 0, "2-3": 0, "3-4": 0, "4-5": 0, ">5": 0,
      };
      comps.forEach((c) => {
        const tatMs = new Date(c.complaintCloseTime) - new Date(c.assignServiceCenterTime);
        const tatDays = Math.ceil(tatMs / (1000 * 60 * 60 * 24));
        if (tatDays === 0) buckets["0"]++;
        else if (tatDays === 1) buckets["1"]++;
        else if (tatDays === 2) buckets["1-2"]++;
        else if (tatDays === 3) buckets["2-3"]++;
        else if (tatDays === 4) buckets["3-4"]++;
        else if (tatDays === 5) buckets["4-5"]++;
        else buckets[">5"]++;
      });
      tatBucketsByServiceCenter[scId] = buckets;
    }

    const summary = payments.map((payment) => {
      const scId = payment._id.toString();
      const comps = complaintsByServiceCenter[scId] || [];
      const complaintCount = comps.length;
      const validComplaintIds = (payment.complaintIds || []).filter(Boolean);
      const validComplaintIdSet = new Set(validComplaintIds.map(id => id.toString()));
      const duplicateDetails = payment.duplicateComplaintDetails || [];

      let duplicatePaymentsToSubtract = 0;

      duplicateDetails.forEach(item => {
        const id = item.complaintId?.toString();
        const amount = item.payment || 0;

        // ✅ Only count payments > 350
        if (validComplaintIdSet.has(id) && amount > 350) {
          duplicatePaymentsToSubtract += amount;
        }
      });

      // console.log("duplicatePaymentsToSubtract", duplicatePaymentsToSubtract);
      const totalComplaintPayments = validComplaintIds.length;
      const totalNonComplaintPayments = payment.totalPayments - totalComplaintPayments;;
      const nonComplaintAmount =
        totalNonComplaintPayments > 0
          ? duplicatePaymentsToSubtract
          : 0;

      // console.log("duplicateDetails", payment.duplicateComplaintDetails);


      return {
        _id: payment._id,
        name: payment.name,
        contactNo: payment.contactNo,
        totalAmount: payment.totalAmount,
        unpaidCount: payment.unpaidCount,
        paidCount: payment.paidCount,
        totalComplaints: complaintCount,
        averagePaymentPerComplaint: complaintCount > 0
          ? (payment.totalAmount - nonComplaintAmount) / complaintCount
          : 0,

        percentageUnpaid: payment.totalPayments > 0 ? (payment.unpaidCount / payment.totalPayments) * 100 : 0,
        percentagePaid: payment.totalPayments > 0 ? (payment.paidCount / payment.totalPayments) * 100 : 0,
        tatReport: tatBucketsByServiceCenter[scId] || {
          "0": 0, "1": 0, "1-2": 0, "2-3": 0, "3-4": 0, "4-5": 0, ">5": 0,
        },
        hasComplaintPayments: totalComplaintPayments > 0,
        totalComplaintPayments,
        totalNonComplaintPayments,
        nonComplaintAmount,
        duplicatePaymentsSum: duplicatePaymentsToSubtract,
        duplicateComplaintDetails: duplicateDetails,
      };
    });

    // Sorting
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

    return res.json({ summary });
  } catch (err) {
    console.error("❌ Error in /wallet-payment-summary:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});














module.exports = router;