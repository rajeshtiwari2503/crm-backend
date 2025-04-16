const express = require("express");
const router = new express.Router();
const {
  BrandRegistrationModel,
  ServiceModel,
  TechnicianModal,
  EmployeeModel,
  DealerModel,
  UserModel
} = require('../models/registration');
const WalletModel = require("../models/wallet")
const Orders = require("../models/order");
const SpareParts = require("../models/sparePart");
const ProductModel = require("../models/product");
const Complaints = require("../models/complaint");
const ComplaintModal = require("../models/complaint");
const ServicePayment = require("../models/servicePaymentModel");

router.get("/dashboardDetails", async (req, res) => {
  try {
    const { now, oneDayAgo, fiveDaysAgo, todayStart } = calculateDateRanges();
    const datetoday = new Date();
    datetoday.setHours(23, 59, 59, 999);
    const [
      customerCount,
      orderCount,
      serviceCount,
      technicianCount,
      dealerCount,
      sparePartCount,
      brandCount,
      allComplaintCount,
      complaintProdressCount,
      complaintAssignCount,
      complaintPendingCount,
      complaintCompleteCount,
      complaintCancelCount,
      complaintPartPendingCount,
      complaintCustomerSidePendingCount,
      complaintFinalVerificationCount,
      complaints0To1Days,
      complaints2To5Days,
      complaintsMoreThan5Days,
      complaintsCompletedToday,
      complaints0To1PartPendingDays,
      complaints2To5PartPendingDays,
      complaintsMoreThan5PartPendingDays,
      schedule,
      scheduleUpcomming,
      centerPayment,
      centerPaidPayment,
      centerUnPaidPayment,
    ] = await Promise.all([
      UserModel.countDocuments({}),
      Orders.countDocuments({}),
      ServiceModel.countDocuments({}),
      TechnicianModal.countDocuments({}),
      DealerModel.countDocuments({}),
      SpareParts.countDocuments({}),
      BrandRegistrationModel.countDocuments({}),
      Complaints.countDocuments({}),
      Complaints.countDocuments({ status: 'IN PROGRESS' }),
      Complaints.countDocuments({ status: 'ASSIGN' }),
      Complaints.countDocuments({ status: 'PENDING' }),
      Complaints.countDocuments({ status: 'COMPLETED' }),
      Complaints.countDocuments({ status: 'CANCELED' }),
      Complaints.countDocuments({ status: 'PART PENDING' }),
      Complaints.countDocuments({ status: 'CUSTOMER SIDE PENDING' }),
      Complaints.countDocuments({ status: 'FINAL VERIFICATION' }),
     

      // Complaints.countDocuments({  createdAt: { $gte: oneDayAgo } }),
      // Complaints.countDocuments({   createdAt: { $gte: fiveDaysAgo, $lt: oneDayAgo } }),
      // Complaints.countDocuments({   createdAt: { $lt: fiveDaysAgo } })
      // ]);
      // Complaints.countDocuments({ status: 'PENDING', createdAt: { $gte: oneDayAgo } }),
      // Complaints.countDocuments({ status: 'PENDING', createdAt: { $gte: fiveDaysAgo, $lt: oneDayAgo } }),
      // Complaints.countDocuments({ status: 'PENDING', createdAt: { $lt: fiveDaysAgo } })
      Complaints.countDocuments({
        $or: [{ status: 'PENDING' }, { status: 'IN PROGRESS' }],
        createdAt: { $gte: oneDayAgo }
      }),
      Complaints.countDocuments({
        $or: [{ status: 'PENDING' }, { status: 'IN PROGRESS' }],
        createdAt: { $gte: fiveDaysAgo, $lt: oneDayAgo }
      }),
      Complaints.countDocuments({
        $or: [{ status: 'PENDING' }, { status: 'IN PROGRESS' }],
        createdAt: { $lt: fiveDaysAgo }
      }),
      Complaints.countDocuments({    $or: [{ status: 'FINAL VERIFICATION' }, { status: 'COMPLETED' }], updatedAt: { $gte: todayStart } }),

      Complaints.countDocuments({ status: 'PART PENDING', createdAt: { $gte: oneDayAgo } }),
      Complaints.countDocuments({ status: 'PART PENDING', createdAt: { $gte: fiveDaysAgo, $lt: oneDayAgo } }),
      Complaints.countDocuments({ status: 'PART PENDING', createdAt: { $lt: fiveDaysAgo } }),
      // Complaints.countDocuments({ status: 'SCHEDULE UPCOMMING' }),
      Complaints.countDocuments({
        $or: [
          
          { preferredServiceDate: { $gte: datetoday }, status: { $nin: ["COMPLETED", "FINAL VERIFICATION", "CANCELED"] } } // Past but not completed/canceled
        ]
      }),
      // Complaints.countDocuments({  preferredServiceDate: { $gte: todayStart  } }),
      Complaints.countDocuments({
        $or: [
          
          { preferredServiceDate: { $lt: todayStart }, status: { $nin: ["COMPLETED", "FINAL VERIFICATION", "CANCELED"] } } // Past but not completed/canceled
        ]
      }),
      
      ServicePayment.countDocuments({} ),
      ServicePayment.countDocuments({ status: 'PAID' }),
      ServicePayment.countDocuments({ status: 'UNPAID' }),
     
    ]);

    res.json({
      customers: customerCount,
      orders: orderCount,
      services: serviceCount,
      technicians: technicianCount,
      dealers: dealerCount,
      spareParts: sparePartCount,
      brands: brandCount,
      complaints: {
        allComplaints: allComplaintCount,
        inProgress: complaintProdressCount,
        assign: complaintAssignCount,
        pending: complaintPendingCount,
        complete: complaintCompleteCount,
        cancel: complaintCancelCount,
        partPending: complaintPartPendingCount,
        customerSidePending: complaintCustomerSidePendingCount,
        finalVerification: complaintFinalVerificationCount,
        zeroToOneDays: complaints0To1Days,
        twoToFiveDays: complaints2To5Days,
        moreThanFiveDays: complaintsMoreThan5Days,
        completedToday: complaintsCompletedToday,
        zeroToOneDaysPartPending: complaints0To1PartPendingDays,
        twoToFiveDaysPartPending: complaints2To5PartPendingDays,
        moreThanFiveDaysPartPending: complaintsMoreThan5PartPendingDays,
        completedToday: complaintsCompletedToday,
        schedule: schedule,
        scheduleUpcomming: scheduleUpcomming,
       
      },
      centerPayment:centerPayment,
      centerPaidPayment:centerPaidPayment,
      centerUnPaidPayment:centerUnPaidPayment,
    });
  } catch (err) {
    res.status(500).send(err);
  }
});


router.get('/getUserAndProduct', async (req, res) => {
  try {
    const [
      customers,
      services,
      technicians,
      dealers,
      brands,
      product
    ] = await Promise.all([
      UserModel.find({}),
      ServiceModel.find({}),
      TechnicianModal.find({}),
      DealerModel.find({}),
      BrandRegistrationModel.find({}),
      ProductModel.find({})
    ]);

    res.json({
      customers: customers,
      services: services,
      technicians: technicians,
      dealers: dealers,
      brands: brands,
      product: product,
    });
  } catch (err) {
    console.error('Error fetching dashboard details:', err);
    res.status(500).send(err);
  }
});



 

// router.post("/dashboardDetailsByEmployeeStateZone", async (req, res) => {
//   try {
//     const { now, oneDayAgo, fiveDaysAgo, todayStart } = calculateDateRanges();
//     const { stateZone } = req.body;

//     // console.log("Received stateZone in req.body:", stateZone);

//     if (!Array.isArray(stateZone) || stateZone.length === 0) {
//       return res.status(400).json({ message: "Invalid or empty stateZone array" });
//     }

//     // Adjust filter based on whether stateZone is stored as an array or a string
//     const stateZoneFilter = {
//       $or: [
//         { state: { $in: stateZone.map(zone => zone.trim()) } }, // If stateZone is a string
//         { state: { $elemMatch: { $in: stateZone.map(zone => zone.trim()) } } }, // If stateZone is an array
//       ],
//     };

//     // console.log("MongoDB Filter:", JSON.stringify(stateZoneFilter, null, 2));  

//     // Define all complaint queries
//     const queries = {
//       allComplaints: {},
//       inProgress: { status: "IN PROGRESS" },
//       assign: { status: "ASSIGN" },
//       pending: { status: "PENDING" },
//       complete: { status: "COMPLETED" },
//       cancel: { status: "CANCELED" },
//       partPending: { status: "PART PENDING" },
//       finalVerification: { status: "FINAL VERIFICATION" },
//       schedule:{ status: 'SCHEDULE UPCOMMING' },
//       zeroToOneDays: {
//         status: { $in: ["PENDING", "IN PROGRESS"] },
//         createdAt: { $gte: new Date(oneDayAgo) },
//       },
//       twoToFiveDays: {
//         status: { $in: ["PENDING", "IN PROGRESS"] },
//         createdAt: { $gte: new Date(fiveDaysAgo), $lt: new Date(oneDayAgo) },
//       },
//       moreThanFiveDays: {
//         status: { $in: ["PENDING", "IN PROGRESS"] },
//         createdAt: { $lt: new Date(fiveDaysAgo) },
//       },
//       completedToday: { status: "COMPLETED", updatedAt: { $gte: todayStart } },
//       zeroToOneDaysPartPending: { status: "PART PENDING", createdAt: { $gte: oneDayAgo } },
//       twoToFiveDaysPartPending: {
//         status: "PART PENDING",
//         createdAt: { $gte: fiveDaysAgo, $lt: oneDayAgo },
//       },
//       moreThanFiveDaysPartPending: { status: "PART PENDING", createdAt: { $lt: fiveDaysAgo } },
//       scheduleUpcomming: {
//         $or: [
//           { preferredServiceDate: { $gte: todayStart } }, 
//           {
//             preferredServiceDate: { $lt: todayStart }, 
//             status: { $nin: ["COMPLETED", "FINAL VERIFICATION", "CANCELED"] }, 
//           },
//         ],
//       },
//     };
    
     
//     // Execute all queries in parallel
//     // const complaintCounts = await Promise.all(
//     //   Object.entries(queries).map(([key, query]) =>
//     //     Complaints.countDocuments({ ...query, ...stateZoneFilter })
//     //   )
//     // );
//     const complaintCounts = await Promise.all(
//       Object.entries(queries).map(([key, query]) =>
//         Complaints.countDocuments({ ...query, ...stateZoneFilter })
//       )
//     );
//     // Construct response dynamically
//     const response = Object.fromEntries(
//       Object.keys(queries).map((key, index) => [key, complaintCounts[index]])
//     );

//     res.json({ complaints: response });
//   } catch (err) {
//     console.error("Error fetching dashboard details:", err);
//     res.status(500).json({ message: "Internal Server Error", error: err.message });
//   }
// });



// 07/04/2025
// router.post("/dashboardDetailsByEmployeeStateZone", async (req, res) => { 
//   try {
//     const { now, oneDayAgo, fiveDaysAgo, todayStart } = calculateDateRanges();
//     const { stateZone } = req.body;
//     const datetoday = new Date();
//     datetoday.setHours(23, 59, 59, 999);
//     if (!Array.isArray(stateZone) || stateZone.length === 0) {
//       return res.status(400).json({ message: "Invalid or empty stateZone array" });
//     }

//     const stateZoneFilter = {
//       $or: [
//         { state: { $in: stateZone.map(zone => zone.trim()) } },
//         { state: { $elemMatch: { $in: stateZone.map(zone => zone.trim()) } } },
//       ],
//     };

//     const queries = {
//       allComplaints: {},
//       inProgress: { status: "IN PROGRESS" },
//       assign: { status: "ASSIGN" },
//       pending: { status: "PENDING" },
//       complete: { status: "COMPLETED" },
//       cancel: { status: "CANCELED" },
//       partPending: { status: "PART PENDING" },
//       finalVerification: { status: "FINAL VERIFICATION" },
//       schedule: {
//         $and: [
//           stateZoneFilter, // Ensure the stateZone filter is applied
//           {
//             $or: [
          
//               { preferredServiceDate: { $gte: datetoday }, status: { $nin: ["COMPLETED", "FINAL VERIFICATION", "CANCELED"] } } // Past but not completed/canceled
//             ]
//           }
//         ]
//       },
//       zeroToOneDays: {
//         status: { $in: ["PENDING", "IN PROGRESS"] },
//         createdAt: { $gte: new Date(oneDayAgo) },
//       },
//       twoToFiveDays: {
//         status: { $in: ["PENDING", "IN PROGRESS"] },
//         createdAt: { $gte: new Date(fiveDaysAgo), $lt: new Date(oneDayAgo) },
//       },
//       moreThanFiveDays: {
//         status: { $in: ["PENDING", "IN PROGRESS"] },
//         createdAt: { $lt: new Date(fiveDaysAgo) },
//       },
//       completedToday: { status: "COMPLETED", updatedAt: { $gte: todayStart } },
//       zeroToOneDaysPartPending: { status: "PART PENDING", createdAt: { $gte: oneDayAgo } },
//       twoToFiveDaysPartPending: {
//         status: "PART PENDING",
//         createdAt: { $gte: fiveDaysAgo, $lt: oneDayAgo },
//       },
//       moreThanFiveDaysPartPending: { status: "PART PENDING", createdAt: { $lt: fiveDaysAgo } },

//       // ✅ Fixed `scheduleUpcomming`
//       scheduleUpcomming: {
//         $and: [
//           stateZoneFilter, // Ensure the stateZone filter is applied
//           {
//             $or: [
          
//               { preferredServiceDate: { $lt: todayStart }, status: { $nin: ["COMPLETED", "FINAL VERIFICATION", "CANCELED"] } } // Past but not completed/canceled
//             ]
//           }
//         ]
//       },
      
//     };

//     // 🔍 Debug log: check scheduleUpcomming count
//     const scheduleUpcommingCount = await Complaints.countDocuments({
//       ...queries.scheduleUpcomming,
//       ...stateZoneFilter,
//     });
//     // console.log("🔍 Debug: scheduleUpcomming Count:", scheduleUpcommingCount);

//     // Execute all queries in parallel
//     const complaintCounts = await Promise.all(
//       Object.entries(queries).map(([key, query]) =>
//         Complaints.countDocuments({ ...query, ...stateZoneFilter })
//       )
//     );

//     const response = Object.fromEntries(
//       Object.keys(queries).map((key, index) => [key, complaintCounts[index]])
//     );

//     res.json({ complaints: response });
//   } catch (err) {
//     console.error("Error fetching dashboard details:", err);
//     res.status(500).json({ message: "Internal Server Error", error: err.message });
//   }
// });


router.post("/dashboardDetailsByEmployeeStateZone", async (req, res) => {
  try {
    const { now, oneDayAgo, fiveDaysAgo, todayStart } = calculateDateRanges();
    const { stateZone = [], brand = [] } = req.body;
    const datetoday = new Date();
    datetoday.setHours(23, 59, 59, 999);

    // 🔍 Optional filters
    const filters = [];

    if (Array.isArray(stateZone) && stateZone.length > 0) {
      filters.push({
        $or: [
          { state: { $in: stateZone.map(zone => zone.trim()) } },
          { state: { $elemMatch: { $in: stateZone.map(zone => zone.trim()) } } },
        ]
      });
    }

    if (Array.isArray(brand) && brand.length > 0) {
      filters.push({
        brandId: { $in: brand.map(b => b.value) }
      });
    }

    // 🔧 Define queries
    const queries = {
      allComplaints: {},
      inProgress: { status: "IN PROGRESS" },
      assign: { status: "ASSIGN" },
      pending: { status: "PENDING" },
      complete: { status: "COMPLETED" },
      cancel: { status: "CANCELED" },
      partPending: { status: "PART PENDING" },
      customerSidePending: { status: "CUSTOMER SIDE PENDING" },
      finalVerification: { status: "FINAL VERIFICATION" },
      schedule: {
        $and: [
          {
            preferredServiceDate: { $gte: datetoday },
            status: { $nin: ["COMPLETED", "FINAL VERIFICATION", "CANCELED"] },
          }
        ]
      },
      zeroToOneDays: {
        status: { $in: ["PENDING", "IN PROGRESS"] },
        createdAt: { $gte: new Date(oneDayAgo) },
      },
      twoToFiveDays: {
        status: { $in: ["PENDING", "IN PROGRESS"] },
        createdAt: { $gte: new Date(fiveDaysAgo), $lt: new Date(oneDayAgo) },
      },
      moreThanFiveDays: {
        status: { $in: ["PENDING", "IN PROGRESS"] },
        createdAt: { $lt: new Date(fiveDaysAgo) },
      },
      completedToday: {  $or: [{ status: 'FINAL VERIFICATION' }, { status: 'COMPLETED' }], updatedAt: { $gte: todayStart } },
      zeroToOneDaysPartPending: { status: "PART PENDING", createdAt: { $gte: oneDayAgo } },
      twoToFiveDaysPartPending: {
        status: "PART PENDING",
        createdAt: { $gte: fiveDaysAgo, $lt: oneDayAgo },
      },
      moreThanFiveDaysPartPending: { status: "PART PENDING", createdAt: { $lt: fiveDaysAgo } },
      scheduleUpcomming: {
        $and: [
          {
            preferredServiceDate: { $lt: todayStart },
            status: { $nin: ["COMPLETED", "FINAL VERIFICATION", "CANCELED"] },
          }
        ]
      },
    };

    // 🔁 Count each query with filters
    const complaintCounts = await Promise.all(
      Object.entries(queries).map(async ([key, query]) => {
        let combinedQuery = { ...query };

        if (filters.length > 0) {
          if (combinedQuery.$and) {
            combinedQuery.$and = [...combinedQuery.$and, ...filters];
          } else {
            combinedQuery = { $and: [combinedQuery, ...filters] };
          }
        }

        const count = await Complaints.countDocuments(combinedQuery);
        return count;
      })
    );

    const response = Object.fromEntries(
      Object.keys(queries).map((key, index) => [key, complaintCounts[index]])
    );

    res.json({ complaints: response });
  } catch (err) {
    console.error("Error fetching dashboard details:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});


// router.post("/dashboardDetailsByEmployeeStateZone", async (req, res) => {
//   try {
//     const { now, oneDayAgo, fiveDaysAgo, todayStart } = calculateDateRanges();
//     const { stateZone, brand } = req.body;

//     console.log("req.body", req.body);

//     if (!Array.isArray(stateZone) || stateZone.length === 0) {
//       return res.status(400).json({ message: "Invalid or empty stateZone array" });
//     }

//     const datetoday = new Date();
//     datetoday.setHours(23, 59, 59, 999);

//     // Filters
//     const stateZoneFilter = {
//       $or: [
//         { state: { $in: stateZone.map(zone => zone.trim()) } },
//         { state: { $elemMatch: { $in: stateZone.map(zone => zone.trim()) } } },
//       ]
//     };

//     const brandFilter = brand.length > 0
//       ? { brandId: { $in: brand.map(b => b.value) } }
//       : null;

//     // Query definitions
//     const queries = {
//       allComplaints: {},
//       inProgress: { status: "IN PROGRESS" },
//       assign: { status: "ASSIGN" },
//       pending: { status: "PENDING" },
//       complete: { status: "COMPLETED" },
//       cancel: { status: "CANCELED" },
//       partPending: { status: "PART PENDING" },
//       finalVerification: { status: "FINAL VERIFICATION" },
//       schedule: {
//         preferredServiceDate: { $gte: datetoday },
//         status: { $nin: ["COMPLETED", "FINAL VERIFICATION", "CANCELED"] }
//       },
//       zeroToOneDays: {
//         status: { $in: ["PENDING", "IN PROGRESS"] },
//         createdAt: { $gte: new Date(oneDayAgo) },
//       },
//       twoToFiveDays: {
//         status: { $in: ["PENDING", "IN PROGRESS"] },
//         createdAt: { $gte: new Date(fiveDaysAgo), $lt: new Date(oneDayAgo) },
//       },
//       moreThanFiveDays: {
//         status: { $in: ["PENDING", "IN PROGRESS"] },
//         createdAt: { $lt: new Date(fiveDaysAgo) },
//       },
//       completedToday: {
//         status: "COMPLETED",
//         updatedAt: { $gte: todayStart },
//       },
//       zeroToOneDaysPartPending: {
//         status: "PART PENDING",
//         createdAt: { $gte: oneDayAgo }
//       },
//       twoToFiveDaysPartPending: {
//         status: "PART PENDING",
//         createdAt: { $gte: fiveDaysAgo, $lt: oneDayAgo }
//       },
//       moreThanFiveDaysPartPending: {
//         status: "PART PENDING",
//         createdAt: { $lt: fiveDaysAgo }
//       },
//       scheduleUpcomming: {
//         preferredServiceDate: { $lt: todayStart },
//         status: { $nin: ["COMPLETED", "FINAL VERIFICATION", "CANCELED"] }
//       }
//     };

//     // Count all queries in parallel
//     const complaintCounts = await Promise.all(
//       Object.entries(queries).map(async ([key, query]) => {
//         const filter = {
//           $and: [query, stateZoneFilter]
//         };
//         if (brandFilter) filter.$and.push(brandFilter);
//         const count = await Complaints.countDocuments(filter);
//         return count;
//       })
//     );

//     // Combine results
//     const response = Object.fromEntries(
//       Object.keys(queries).map((key, index) => [key, complaintCounts[index]])
//     );

//     res.json({ complaints: response });
//   } catch (err) {
//     console.error("Error fetching dashboard details:", err);
//     res.status(500).json({ message: "Internal Server Error", error: err.message });
//   }
// });









router.get('/getCustomers/:id', async (req, res) => {
  try {
    const brandId = req.params.id; // Extract brandId from query parameters
    // console.log(brandId);

    // Find complaints based on the brandId
    const complaints = await Complaints.find(brandId ? { brandId } : {});

    // Extract unique user IDs (or other fields, such as email) from complaints
    const userIds = [...new Set(complaints.map(complaint => complaint.userId))];

    // Find users who match the extracted user IDs
    const customers = await UserModel.find({ _id: { $in: userIds } });

    res.json({
      customers,       // Users associated with complaints
      complaints,  // The complaints data
    });
  } catch (err) {
    console.error('Error fetching users and complaints by brandId:', err);
    res.status(500).send(err);
  }
});



router.get("/dashboardDetailsBySeviceCenterId/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const serviceCenter = await ServiceModel.findById(id);
    if (!serviceCenter) {
      return res.status(404).json({ message: "Service Center not found" });
    }
    const serviceCenterWallet = await WalletModel.findOne({ serviceCenterId: id }).exec();
// console.log("serviceCenterWallet",serviceCenterWallet);

// const {totalCommission}=serviceCenterWallet;
    const { totalAmount } = serviceCenter;
    // Get the current date
    const now1 = new Date();
    const datetoday = new Date();
    datetoday.setHours(23, 59, 59, 999);
    // Start of today (midnight of the current day)
    const startOfDay = new Date(now1.getFullYear(), now1.getMonth(), now1.getDate());
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    // Start of the current week (Sunday)
    const startOfWeek = new Date(now1);
    startOfWeek.setDate(now1.getDate() - now1.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Start of the current month
    const startOfMonth = new Date(now1.getFullYear(), now1.getMonth(), 1);

    // Start of the last month
    const startOfLastMonth = new Date(now1.getFullYear(), now1.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now1.getFullYear(), now1.getMonth(), 0);

    // Start of the last week (previous week Sunday)
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    startOfLastWeek.setHours(0, 0, 0, 0);
    const endOfLastWeek = new Date(startOfWeek);
    const { now, oneDayAgo, fiveDaysAgo } = calculateDateRanges();
    // Query to filter complaints by assignServiceCenterId
    const query = { assignServiceCenterId: id };

    // Fetch counts for all complaints and complaints with specific statuses
    const [
      allComplaintCount,
      complaintNewCount,
      complaintAssignCount,
      complaintPendingCount,
      complaintCompleteCount,
      complaintCancelCount,
      complaintPartPendingCount,
      complaintCustomerSidePendingCount,
      complaints0To1Days,
      complaints2To5Days,
      complaintsMoreThan5Days,
      complaints0To1PartPendingDays,
      complaints2To5PartPendingDays,
      complaintsMoreThan5PartPendingDays,
      schedule,
      scheduleUpcomming ,
     
      allMonthComplaintCount,
      lastMonthNewCount,
      lastMonthAssignCount,
      lastMonthPendingCount,
      lastMonthCompleteCount,
      lastMonthCancelCount,
      lastMonthPartPendingCount,
      allWeekComplaintCount,

      lastWeekNewCount,
      lastWeekAssignCount,
      lastWeekPendingCount,
      lastWeekCompleteCount,
      lastWeekCancelCount,
      lastWeekPartPendingCount,
      allDailyComplaintCount,
      dailyNewCount,
      dailyAssignCount,
      dailyPendingCount,
      dailyCompleteCount,
      dailyCancelCount,
      dailyPartPendingCount,
      complaintFinalVerificationCount,
    
    ] = await Promise.all([
      // Total counts
      Complaints.countDocuments(query),
      Complaints.countDocuments({ ...query, status: 'IN PROGRESS' }),
      Complaints.countDocuments({ ...query, status: 'ASSIGN' }),
      Complaints.countDocuments({ ...query, status: 'PENDING' }),
      Complaints.countDocuments({ ...query, status: 'COMPLETED' }),
      Complaints.countDocuments({ ...query, status: 'CANCELED' }),
      Complaints.countDocuments({ ...query, status: 'PART PENDING' }),
      Complaints.countDocuments({ ...query, status: "CUSTOMER SIDE PENDING" }),
      // Complaints.countDocuments({ ...query, status: 'PENDING', createdAt: { $gte: oneDayAgo } }),
      // Complaints.countDocuments({ ...query, status: 'PENDING', createdAt: { $gte: fiveDaysAgo, $lt: oneDayAgo } }),
      // Complaints.countDocuments({ ...query, status: 'PENDING', createdAt: { $lt: fiveDaysAgo } }),
      Complaints.countDocuments({ ...query,  status: { $in: ["PENDING", "IN PROGRESS"] }, createdAt: { $gte: oneDayAgo } }),
      Complaints.countDocuments({ ...query,  status: { $in: ["PENDING", "IN PROGRESS"] }, createdAt: { $gte: fiveDaysAgo, $lt: oneDayAgo } }),
      Complaints.countDocuments({ ...query,  status: { $in: ["PENDING", "IN PROGRESS"] }, createdAt: { $lt: fiveDaysAgo } }),
      
      Complaints.countDocuments({ ...query, status: 'PART PENDING', createdAt: { $gte: oneDayAgo } }),
      Complaints.countDocuments({ ...query, status: 'PART PENDING', createdAt: { $gte: fiveDaysAgo, $lt: oneDayAgo } }),
      Complaints.countDocuments({ ...query, status: 'PART PENDING', createdAt: { $lt: fiveDaysAgo } }),
      Complaints.countDocuments({...query,
        $or: [
          
          {...query, preferredServiceDate: { $gte: datetoday }, status: { $nin: ["COMPLETED", "FINAL VERIFICATION", "CANCELED"] } } // Past but not completed/canceled
        ]
      }),
      Complaints.countDocuments({
        $or: [
          
          {...query, preferredServiceDate: { $lt: todayStart }, status: { $nin: ["COMPLETED", "FINAL VERIFICATION", "CANCELED"] } } // Past but not completed/canceled
        ]
      }),
      // Last Month counts
      Complaints.countDocuments({ ...query, createdAt: { $gte: startOfLastMonth, $lt: startOfMonth } }),
      Complaints.countDocuments({ ...query, status: 'IN PROGRESS', createdAt: { $gte: startOfLastMonth, $lt: startOfMonth } }),
      Complaints.countDocuments({ ...query, status: 'ASSIGN', createdAt: { $gte: startOfLastMonth, $lt: startOfMonth } }),
      Complaints.countDocuments({ ...query, status: 'PENDING', createdAt: { $gte: startOfLastMonth, $lt: startOfMonth } }),
      Complaints.countDocuments({ ...query, status: 'COMPLETED', createdAt: { $gte: startOfLastMonth, $lt: startOfMonth } }),
      Complaints.countDocuments({ ...query, status: 'CANCELED', createdAt: { $gte: startOfLastMonth, $lt: startOfMonth } }),
      Complaints.countDocuments({ ...query, status: 'PART PENDING', createdAt: { $gte: startOfLastMonth, $lt: startOfMonth } }),

      // Last Week counts
      Complaints.countDocuments({ ...query, createdAt: { $gte: startOfLastMonth, $lt: startOfMonth } }),
      Complaints.countDocuments({ ...query, status: 'IN PROGRESS', createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek } }),
      Complaints.countDocuments({ ...query, status: 'ASSIGN', createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek } }),
      Complaints.countDocuments({ ...query, status: 'PENDING', createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek } }),
      Complaints.countDocuments({ ...query, status: 'COMPLETED', createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek } }),
      Complaints.countDocuments({ ...query, status: 'CANCELED', createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek } }),
      Complaints.countDocuments({ ...query, status: 'PART PENDING', createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek } }),


      // Daily counts
      Complaints.countDocuments({ ...query, createdAt: { $gte: startOfDay } }),
      Complaints.countDocuments({ ...query, status: 'IN PROGRESS', createdAt: { $gte: startOfDay } }),
      Complaints.countDocuments({ ...query, status: 'ASSIGN', createdAt: { $gte: startOfDay } }),
      Complaints.countDocuments({ ...query, status: 'PENDING', createdAt: { $gte: startOfDay } }),
      Complaints.countDocuments({ ...query, status: 'COMPLETED', createdAt: { $gte: startOfDay } }),
      Complaints.countDocuments({ ...query, status: 'CANCELED', createdAt: { $gte: startOfDay } }),
      Complaints.countDocuments({ ...query, status: 'PART PENDING', createdAt: { $gte: startOfDay } }),
      Complaints.countDocuments({...query, status: 'FINAL VERIFICATION' }),
     
    ]);

    // Return aggregated data as JSON response
    res.json({
       
      complaints: {
        totalAmount,
        walletAmount:serviceCenterWallet?.totalCommission,
        allComplaints: allComplaintCount,
        inProgress: complaintNewCount,
        assign: complaintAssignCount,
        pending: complaintPendingCount,
        complete: complaintCompleteCount,
        cancel: complaintCancelCount,
        partPending: complaintPartPendingCount,
        customerSidePending: complaintCustomerSidePendingCount,
        finalVerification: complaintFinalVerificationCount,
        schedule:schedule,
        scheduleUpcomming: scheduleUpcomming,
        zeroToOneDays: complaints0To1Days,
        twoToFiveDays: complaints2To5Days,
        moreThanFiveDays: complaintsMoreThan5Days,
        zeroToOneDaysPartPending: complaints0To1PartPendingDays,
        twoToFiveDaysPartPending: complaints2To5PartPendingDays,
        moreThanFiveDaysPartPending: complaintsMoreThan5PartPendingDays,
      
        lastMonth: {
          allComplaints: allMonthComplaintCount,
          inProgress: lastMonthNewCount,
          assign: lastMonthAssignCount,
          pending: lastMonthPendingCount,
          complete: lastMonthCompleteCount,
          cancel: lastMonthCancelCount,
          partPending: lastMonthPartPendingCount,
          zeroToOneDays: complaints0To1Days,
          twoToFiveDays: complaints2To5Days,
          moreThanFiveDays: complaintsMoreThan5Days,
        },
        lastWeek: {
          allComplaints: allWeekComplaintCount,
          inProgress: lastWeekNewCount,
          assign: lastWeekAssignCount,
          pending: lastWeekPendingCount,
          complete: lastWeekCompleteCount,
          cancel: lastWeekCancelCount,
          partPending: lastWeekPartPendingCount
        },
        daily: {
          allComplaints: allDailyComplaintCount,
          inProgress: dailyNewCount,
          assign: dailyAssignCount,
          pending: dailyPendingCount,
          complete: dailyCompleteCount,
          cancel: dailyCancelCount,
          partPending: dailyPartPendingCount,
        }
      },
      
    });

  } catch (err) {
    console.error('Error in /dashboardDetailsBySeviceCenterId/:id:', err);
    res.status(500).send(err);
  }
});
 




router.get("/dashboardDetailsByTechnicianId/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { technicianId: id };

    const { now, oneDayAgo, fiveDaysAgo } = calculateDateRanges();
    const [
      allComplaintCount,
      complaintProdressCount,
      complaintAssignCount,
      complaintPendingCount,
      complaintCompleteCount,
      complaintCancelCount,
      complaintPartPendingCount,
      complaints0To1Days,
      complaints2To5Days,
      complaintsMoreThan5Days
    ] = await Promise.all([
      Complaints.countDocuments(query),
      Complaints.countDocuments({ ...query, status: 'IN PROGRESS' }),
      Complaints.countDocuments({ ...query, status: 'ASSIGN' }),
      Complaints.countDocuments({ ...query, status: 'PENDING' }),
      Complaints.countDocuments({ ...query, status: 'COMPLETED' }),
      Complaints.countDocuments({ ...query, status: 'CANCELED' }),
      Complaints.countDocuments({ ...query, status: 'PART PENDING' }),
      Complaints.countDocuments({ ...query, createdAt: { $gte: oneDayAgo } }),
      Complaints.countDocuments({ ...query, createdAt: { $gte: fiveDaysAgo, $lt: oneDayAgo } }),
      Complaints.countDocuments({ ...query, createdAt: { $lt: fiveDaysAgo } })
    ]);

    res.json({
      complaints: {
        allComplaints: allComplaintCount,
        inProgress: complaintProdressCount,
        assign: complaintAssignCount,
        pending: complaintPendingCount,
        complete: complaintCompleteCount,
        cancel: complaintCancelCount,
        partPending: complaintPartPendingCount,
        zeroToOneDays: complaints0To1Days,
        twoToFiveDays: complaints2To5Days,
        moreThanFiveDays: complaintsMoreThan5Days
      }
    });
  } catch (err) {
    console.error('Error in /dashboardDetailsById/:id:', err);
    res.status(500).send(err);
  }
});



router.get("/dashboardDetailsByDealerId/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { dealerId: id };
    const { now, oneDayAgo, fiveDaysAgo } = calculateDateRanges();
    const [
      allComplaintCount,
      complaintProdressCount,
      complaintAssignCount,
      complaintPendingCount,
      complaintCompleteCount,
      complaintCancelCount,
      complaintPartPendingCount,
      complaints0To1Days,
      complaints2To5Days,
      complaintsMoreThan5Days
    ] = await Promise.all([
      Complaints.countDocuments(query),
      Complaints.countDocuments({ ...query, status: 'IN PROGRESS' }),
      Complaints.countDocuments({ ...query, status: 'ASSIGN' }),
      Complaints.countDocuments({ ...query, status: 'PENDING' }),
      Complaints.countDocuments({ ...query, status: 'COMPLETED' }),
      Complaints.countDocuments({ ...query, status: 'CANCELED' }),
      Complaints.countDocuments({ ...query, status: 'PART PENDING' }),
      Complaints.countDocuments({ ...query, createdAt: { $gte: oneDayAgo } }),
      Complaints.countDocuments({ ...query, createdAt: { $gte: fiveDaysAgo, $lt: oneDayAgo } }),
      Complaints.countDocuments({ ...query, createdAt: { $lt: fiveDaysAgo } })
    ]);

    res.json({
      complaints: {
        allComplaints: allComplaintCount,
        inProgress: complaintProdressCount,
        assign: complaintAssignCount,
        pending: complaintPendingCount,
        complete: complaintCompleteCount,
        cancel: complaintCancelCount,
        partPending: complaintPartPendingCount,
        zeroToOneDays: complaints0To1Days,
        twoToFiveDays: complaints2To5Days,
        moreThanFiveDays: complaintsMoreThan5Days
      }
    });
  } catch (err) {
    console.error('Error in /dashboardDetailsById/:id:', err);
    res.status(500).send(err);
  }
});


router.get("/dashboardDetailsByUserId/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { userId: id };
    const { now, oneDayAgo, fiveDaysAgo } = calculateDateRanges();
    const [
      allComplaintCount,
      complaintProdressCount,
      complaintAssignCount,
      complaintPendingCount,
      complaintCompleteCount,
      complaintCancelCount,
      complaintPartPendingCount,
      complaints0To1Days,
      complaints2To5Days,
      complaintsMoreThan5Days
    ] = await Promise.all([
      Complaints.countDocuments(query),
      Complaints.countDocuments({ ...query, status: 'IN PROGRESS' }),
      Complaints.countDocuments({ ...query, status: 'ASSIGN' }),
      Complaints.countDocuments({ ...query, status: 'PENDING' }),
      Complaints.countDocuments({ ...query, status: 'COMPLETED' }),
      Complaints.countDocuments({ ...query, status: 'CANCELED' }),
      Complaints.countDocuments({ ...query, status: 'PART PENDING' }),
      Complaints.countDocuments({ ...query, createdAt: { $gte: oneDayAgo } }),
      Complaints.countDocuments({ ...query, createdAt: { $gte: fiveDaysAgo, $lt: oneDayAgo } }),
      Complaints.countDocuments({ ...query, createdAt: { $lt: fiveDaysAgo } })
    ]);

    res.json({
      complaints: {
        allComplaints: allComplaintCount,
        inProgress: complaintProdressCount,
        assign: complaintAssignCount,
        pending: complaintPendingCount,
        complete: complaintCompleteCount,
        cancel: complaintCancelCount,
        partPending: complaintPartPendingCount,
        zeroToOneDays: complaints0To1Days,
        twoToFiveDays: complaints2To5Days,
        moreThanFiveDays: complaintsMoreThan5Days
      }
    });
  } catch (err) {
    console.error('Error in /dashboardDetailsById/:id:', err);
    res.status(500).send(err);
  }
});


// const calculateDateRanges = () => {
//   const now = new Date();
//   const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
//   const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
//   const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

//   return { now, oneDayAgo, twoDaysAgo, fiveDaysAgo };
// };
const calculateDateRanges = () => {
  const now = new Date();
  now.setHours(23, 59, 59, 999); // Ensure the current date is set to end of the day

  const oneDayAgo = new Date(now);
  oneDayAgo.setDate(now.getDate() - 1);
  oneDayAgo.setHours(0, 0, 0, 0); // Start of the day

  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(now.getDate() - 2);
  twoDaysAgo.setHours(0, 0, 0, 0);

  const fiveDaysAgo = new Date(now);
  fiveDaysAgo.setDate(now.getDate() - 5);
  fiveDaysAgo.setHours(0, 0, 0, 0);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return { now, oneDayAgo, twoDaysAgo, fiveDaysAgo, todayStart };
};

// Example usage
// console.log(calculateDateRanges());

// router.get("/dashboardDetailsByBrandId/:id", async (req, res) => {
//   try {
//     const id = req.params.id;
//     const query = { brandId: id };
//     const { now, oneDayAgo, fiveDaysAgo,todayStart } = calculateDateRanges();
//     const datetoday = new Date();
//     datetoday.setHours(23, 59, 59, 999);
    
//     const [
//       allComplaintCount,
//       complaintProdressCount,
//       complaintAssignCount,
//       complaintPendingCount,
//       complaintCompleteCount,
//       complaintCancelCount,
//       complaintPartPendingCount,
//       complaintFinalVerificationCount,
//       complaints0To1Days,
//       complaints2To5Days,
//       complaintsMoreThan5Days,
//       complaints0To1PartPendingDays,
//       complaints2To5PartPendingDays,
//       complaintsMoreThan5PartPendingDays,
//       schedule,
//       scheduleUpcomming,
//     ] = await Promise.all([
//       Complaints.countDocuments(query),
//       Complaints.countDocuments({ ...query, status: 'IN PROGRESS' }),
//       Complaints.countDocuments({ ...query, status: 'ASSIGN' }),
//       Complaints.countDocuments({ ...query, status: 'PENDING' }),
//       Complaints.countDocuments({ ...query, status: 'COMPLETED' }),
//       Complaints.countDocuments({ ...query, status: 'CANCELED' }),
//       Complaints.countDocuments({ ...query, status: 'PART PENDING' }),
//       Complaints.countDocuments({ ...query, status: 'FINAL VERIFICATION' }),
 
//       Complaints.countDocuments({
//         ...query,
//         status: { $in: ["PENDING", "IN PROGRESS"] },
//         createdAt: { $gte: oneDayAgo }
//       }),
//       Complaints.countDocuments({
//         ...query,
//         status: { $in: ["PENDING", "IN PROGRESS"] },
//         createdAt: { $gte:  fiveDaysAgo , $lt: new Date(oneDayAgo.setHours(23, 59, 59, 999)) }
//       }),
//       Complaints.countDocuments({
//         ...query,
//         status: { $in: ["PENDING", "IN PROGRESS"] },
//         createdAt: { $lt: new Date(fiveDaysAgo.setHours(23, 59, 59, 999)) }
//       }),
//       Complaints.countDocuments({
//         ...query,
//         status: "PART PENDING",
//         createdAt: { $gte: oneDayAgo }
//       }),
//       Complaints.countDocuments({
//         ...query,
//         status: "PART PENDING",
//         createdAt: { $gte: new Date(fiveDaysAgo), $lt: new Date(oneDayAgo) }
//       }),
//       Complaints.countDocuments({
//         ...query,
//         status: "PART PENDING",
//         createdAt: { $lt: new Date(fiveDaysAgo) }
//       }),
//       Complaints.countDocuments({...query,
//         $or: [
          
//           {...query, preferredServiceDate: { $gte: datetoday }, status: { $nin: ["COMPLETED", "FINAL VERIFICATION", "CANCELED"] } } // Past but not completed/canceled
//         ]
//       }),
//       Complaints.countDocuments({
//         ...query,
//         preferredServiceDate: { $lt: todayStart },
//         status: { $nin: ["COMPLETED", "FINAL VERIFICATION", "CANCELED"] }
//       }),
      
      
//     ]);

//     res.json({
//       complaints: {
//         allComplaints: allComplaintCount,
//         inProgress: complaintProdressCount,
//         assign: complaintAssignCount,
//         pending: complaintPendingCount,
//         complete: complaintCompleteCount,
//         cancel: complaintCancelCount,
//         partPending: complaintPartPendingCount,
//         finalVerification: complaintFinalVerificationCount,
//         zeroToOneDays: complaints0To1Days,
//         twoToFiveDays: complaints2To5Days,
//         moreThanFiveDays: complaintsMoreThan5Days,
//         zeroToOneDaysPartPending: complaints0To1PartPendingDays,
//         twoToFiveDaysPartPending: complaints2To5PartPendingDays,
//         moreThanFiveDaysPartPending: complaintsMoreThan5PartPendingDays,
//         schedule:schedule,
//         scheduleUpcomming:scheduleUpcomming
//       }
//     });
//   } catch (err) {
//     console.error('Error in /dashboardDetailsById/:id:', err);
//     res.status(500).send(err);
//   }
// });

router.get("/dashboardDetailsByBrandId/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { brandId: id };

    // Calculate date ranges
    const { now, oneDayAgo, fiveDaysAgo, todayStart } = calculateDateRanges();

    // Create new date instances to prevent modifying original objects
    const oneDayAgoEnd = new Date(oneDayAgo);
    oneDayAgoEnd.setHours(23, 59, 59, 999);

    const fiveDaysAgoEnd = new Date(fiveDaysAgo);
    fiveDaysAgoEnd.setHours(23, 59, 59, 999);

    const datetoday = new Date();
    datetoday.setHours(23, 59, 59, 999);

    const [
      allComplaintCount,
      complaintProdressCount,
      complaintAssignCount,
      complaintPendingCount,
      complaintCompleteCount,
      complaintCancelCount,
      complaintPartPendingCount,
      complaintCustomerSidePendingCount,
      complaintFinalVerificationCount,
      complaints0To1Days,
      complaints2To5Days,
      complaintsMoreThan5Days,
      completedTodayCount,
      complaints0To1PartPendingDays,
      complaints2To5PartPendingDays,
      complaintsMoreThan5PartPendingDays,
      schedule,
      scheduleUpcomming,
    ] = await Promise.all([
      Complaints.countDocuments(query),
      Complaints.countDocuments({ ...query, status: "IN PROGRESS" }),
      Complaints.countDocuments({ ...query, status: "ASSIGN" }),
      Complaints.countDocuments({ ...query, status: "PENDING" }),
      Complaints.countDocuments({ ...query, status: "COMPLETED" }),
      Complaints.countDocuments({ ...query, status: "CANCELED" }),
      Complaints.countDocuments({ ...query, status: "PART PENDING" }),
      Complaints.countDocuments({ ...query, status: "CUSTOMER SIDE PENDING" }),
      Complaints.countDocuments({ ...query, status: "FINAL VERIFICATION" }),

      // Complaints in 0-1 days
      Complaints.countDocuments({
        ...query,
        status: { $in: ["PENDING", "IN PROGRESS"] },
        createdAt: { $gte: oneDayAgo }
      }),

      // Complaints in 2-5 days
      Complaints.countDocuments({
        ...query,
        status: { $in: ["PENDING", "IN PROGRESS"] },
        createdAt: { $gte: fiveDaysAgo, $lt: oneDayAgo }
      }),

      // Complaints older than 5 days
      Complaints.countDocuments({
        ...query,
        status: { $in: ["PENDING", "IN PROGRESS"] },
        createdAt: { $lt: fiveDaysAgoEnd }
      }),
      Complaints.countDocuments({   ...query,  $or: [{ status: 'FINAL VERIFICATION' }, { status: 'COMPLETED' }], updatedAt: { $gte: todayStart } }),
      // Part Pending Complaints (0-1 days)
      Complaints.countDocuments({
        ...query,
        status: "PART PENDING",
        createdAt: { $gte: oneDayAgo }
      }),

      // Part Pending Complaints (2-5 days)
      Complaints.countDocuments({
        ...query,
        status: "PART PENDING",
        createdAt: { $gte: fiveDaysAgo, $lt: oneDayAgo }
      }),

      // Part Pending Complaints (>5 days)
      Complaints.countDocuments({
        ...query,
        status: "PART PENDING",
        createdAt: { $lt: fiveDaysAgo }
      }),

      // Scheduled complaints (upcoming)
      Complaints.countDocuments({
        ...query,
        preferredServiceDate: { $gte: datetoday },
        status: { $nin: ["COMPLETED", "FINAL VERIFICATION", "CANCELED"] }
      }),

      // Scheduled complaints (missed)
      Complaints.countDocuments({
        ...query,
        preferredServiceDate: { $lt: todayStart },
        status: { $nin: ["COMPLETED", "FINAL VERIFICATION", "CANCELED"] }
      }),
    ]);

    // Sending the response
    res.json({
      complaints: {
        allComplaints: allComplaintCount,
        inProgress: complaintProdressCount,
        assign: complaintAssignCount,
        pending: complaintPendingCount,
        complete: complaintCompleteCount,
        cancel: complaintCancelCount,
        partPending: complaintPartPendingCount,
        customerSidePending: complaintCustomerSidePendingCount,
        finalVerification: complaintFinalVerificationCount,
        zeroToOneDays: complaints0To1Days,
        twoToFiveDays: complaints2To5Days,
        completedToday:completedTodayCount,
        moreThanFiveDays: complaintsMoreThan5Days,
        zeroToOneDaysPartPending: complaints0To1PartPendingDays,
        twoToFiveDaysPartPending: complaints2To5PartPendingDays,
        moreThanFiveDaysPartPending: complaintsMoreThan5PartPendingDays,
        schedule: schedule,
        scheduleUpcomming: scheduleUpcomming
      }
    });
  } catch (err) {
    console.error("Error in /dashboardDetailsByBrandId/:id:", err);
    res.status(500).send(err);
  }
});






router.get('/getStatewisePendingComplaints', async (req, res) => {
  try {
    // Aggregation pipeline to get count of pending complaints by state
    const complaints = await Complaints.aggregate([
      { $match: { status: 'PENDING' } },  // Filter to include only pending complaints
      { $group: { _id: "$state", count: { $sum: 1 } } }, // Group by state and count
      { $sort: { count: -1 } }
    ]);

    res.status(200).json(complaints);  // Send response with aggregated data
  } catch (error) {
    console.error('Error fetching state-wide pending complaints:', error);
    res.status(500).json({ error: 'Error fetching state-wide pending complaints' });
  }
});


router.get('/getDistrictWisePendingComplaints', async (req, res) => {
  try {
    // Aggregation pipeline to get count of pending complaints by state and district
    const complaints = await Complaints.aggregate([
      {
        $match: { status: 'PENDING' }  // Filter to include only pending complaints
      },
      {
        $group: {
          _id: { state: "$state", district: "$district" },  // Group by state and district
          count: { $sum: 1 }  // Count the number of complaints
        }
      },
      {
        $sort: { "count": -1 }  // Sort by count in descending order
      }
    ]);

    // Transform the output to a more readable format (optional)
    const transformedComplaints = complaints.map(item => ({
      state: item._id.state,
      district: item._id.district,
      count: item.count
    }));

    res.status(200).json(transformedComplaints);  // Send response with aggregated data
  } catch (error) {
    console.error('Error fetching district-wise pending complaints:', error);
    res.status(500).json({ error: 'Error fetching district-wise pending complaints' });
  }
});



router.get('/getServiceCenterWisePendingComplaints', async (req, res) => {
  try {
    // Aggregation pipeline to get count of pending complaints by service center
    const complaints = await Complaints.aggregate([
      { $match: { status: 'PENDING', assignServiceCenter: { $ne: null } } }, // Filter to include only pending complaints with a valid service center
      { $group: { _id: "$assignServiceCenter", count: { $sum: 1 } } },       // Group by service center and count
      { $sort: { count: -1 } }                                              // Sort by count in descending order
    ]);

    res.status(200).json(complaints); // Send response with sorted data
  } catch (error) {
    console.error('Error fetching service-center-wise pending complaints:', error);
    res.status(500).json({ error: 'Error fetching service-center-wise pending complaints' });
  }
});

router.get('/getNoServiceableAreaComplaints', async (req, res) => {
  try {
    // Aggregation pipeline to get pending complaints with no associated service center, including userName and district
    const complaints = await Complaints.aggregate([
      { $match: { status: 'PENDING', assignServiceCenter: { $exists: false } } },  // Filter for pending complaints without service center
      { $project: { fullName: 1, district: 1, state: 1, phoneNumber: 1 } }                             // Project only userName and district fields
    ]);

    res.status(200).json(complaints);  // Send response with list of complaints
  } catch (error) {
    console.error('Error fetching no serviceable area complaints:', error);
    res.status(500).json({ error: 'Error fetching no serviceable area complaints' });
  }
});


router.get('/getComplaintInsights', async (req, res) => {
  try {
    const [
      complaintsByBrand,
      complaintsByLocationAndProduct,
      commonFaults,
      pendingComplaintsByBrand
    ] = await Promise.all([
      Complaints.aggregate([
        // Group complaints by productBrand and count them
        { $group: { _id: "$productBrand", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Complaints.aggregate([
        // Group complaints by both product and productBrand
        {
          $group: {
            _id: { product: "$productName", productBrand: "$productBrand" },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      Complaints.aggregate([
        // Unwind the issueType array
        { $unwind: { path: "$issueType", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$issueType",
            productBrand: { $first: "$productBrand" },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      Complaints.aggregate([
        // Filter only complaints with 'pending' status and group by brand
        { $match: { status: "PENDING" } },
        { $group: { _id: "$productBrand", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.status(200).json({
      complaintsByBrand,
      complaintsByLocationAndProduct,
      commonFaults,
      pendingComplaintsByBrand
    });
  } catch (error) {
    console.error('Error fetching complaint insights:', error);
    res.status(500).json({ error: 'Error fetching complaint insights' });
  }
});


router.get('/getAllUnAssignComplaint', async (req, res) => {
  try {
    const unassignedComplaints = await Complaints.find({
      $or: [
        { assignServiceCenterId: null },
        { assignServiceCenterId: { $exists: false } }
      ],
      status: { $in: ["PENDING", "IN PROGRESS", "PART PENDING"] } // Filtering based on status
    });

    res.status(200).json({ success: true, data: unassignedComplaints });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error retrieving complaints", error });
  }
});



router.get('/getComplaintCountByCityState', async (req, res) => {
  try {
    const complaintCounts = await Complaints.aggregate([
      {
        $group: {
          _id: { city: "$district" }, // Group by city (district)
          TOTAL: { $sum: 1 },
          state: { $first: "$state" },  
          PENDING: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "PENDING"] }, 1, 0] } },
          INPROGRESS: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "IN PROGRESS"] }, 1, 0] } },
          PART_PENDING: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "PART PENDING"] }, 1, 0] } },
          ASSIGN: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "ASSIGN"] }, 1, 0] } },
          CANCEL: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "CANCELED"] }, 1, 0] } },
          COMPLETE: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "COMPLETED"] }, 1, 0] } },
          FINAL_VERIFICATION: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "FINAL VERIFICATION"] }, 1, 0] } }
        }
      },
      {
        $addFields: {
          ACTIVE_COUNT: {
            $add: ["$PENDING", "$INPROGRESS", "$PART_PENDING", "$ASSIGN"]
          }
        }
      },
      {
        $sort: {
          ACTIVE_COUNT: -1, // First sort by combined count of key statuses
          PENDING: -1,
          INPROGRESS: -1,
          PART_PENDING: -1,
          ASSIGN: -1
        } 
      } 
    ]);

    res.status(200).json({ success: true, data: complaintCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error retrieving complaints", error });
  }
});

 
 
router.get("/getComplaintCountByServiceCenter", async (req, res) => {
  try {
    const complaintCounts = await Complaints.aggregate([
      {
        $match: { assignServiceCenterId: { $ne: null } } // Exclude complaints without assignServiceCenterId
      },
      {
        $group: {
          _id: "$assignServiceCenterId",
          assignServiceCenter: { $first: "$assignServiceCenter" },
          city: { $first: "$district" },
          state: { $first: "$state" },
          TOTAL: { $sum: 1 },
          PENDING: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "PENDING"] }, 1, 0] } },
          INPROGRESS: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "IN PROGRESS"] }, 1, 0] } },
          PART_PENDING: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "PART PENDING"] }, 1, 0] } },
          ASSIGN: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "ASSIGN"] }, 1, 0] } },
          CANCEL: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "CANCELED"] }, 1, 0] } },
          COMPLETE: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "COMPLETED"] }, 1, 0] } },
          FINAL_VERIFICATION: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "FINAL VERIFICATION"] }, 1, 0] } }
        }
        
      },
      {
        $addFields: {
          ACTIVE_COUNT: {
            $add: ["$PENDING", "$INPROGRESS", "$PART_PENDING", "$ASSIGN"]
          }
        }
      },
      {
        $sort: {
          ACTIVE_COUNT: -1, // First sort by combined count of key statuses
          PENDING: -1,
          INPROGRESS: -1,
          PART_PENDING: -1,
          ASSIGN: -1
        } // Sort by PENDING complaints in descending order
      }
    ]);

    res.status(200).json({ success: true, data: complaintCounts });
  } catch (error) {
    console.error("Error fetching complaint count:", error);
    res.status(500).json({ success: false, message: "Error retrieving complaints", error });
  }
});


 
router.get('/getComplaintCountByBrand', async (req, res) => {
  try {
    const complaintCounts = await Complaints.aggregate([
      {
        $group: {
          _id: { brandId: "$brandId" }, // Group by city (district)
          TOTAL: { $sum: 1 },
          productBrand: { $first: "$productBrand" },  
          PENDING: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "PENDING"] }, 1, 0] } },
          INPROGRESS: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "IN PROGRESS"] }, 1, 0] } },
          PART_PENDING: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "PART PENDING"] }, 1, 0] } },
          ASSIGN: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "ASSIGN"] }, 1, 0] } },
          CANCEL: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "CANCELED"] }, 1, 0] } },
          COMPLETE: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "COMPLETED"] }, 1, 0] } },
          FINAL_VERIFICATION: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "FINAL VERIFICATION"] }, 1, 0] } }
        }
      },
      {
        $sort: { PENDING: -1 } // Sort by PENDING complaints in descending order
      } 
    ]);



    res.status(200).json({ success: true, data: complaintCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error retrieving complaints", error });
  }
});


 

// Helper function to calculate time difference
const getTimeDifference = (start, end) => {
  if (!start || !end) return { days: 0, hours: 0 };
  let diffMs = new Date(end) - new Date(start);
  let totalHours = Math.max(diffMs / (1000 * 60 * 60), 0);
  let days = Math.floor(totalHours / 24);
  let hours = Math.round(totalHours % 24);
  return { days, hours };
};

// Function to calculate percentage
const calculatePercentage = (count, total) =>
  total > 0 ? ((count / total) * 100).toFixed(2) : "0.00";

// 📌 API: Fetch and Process Complaints
router.get("/getAllTatByBrand", async (req, res) => {
  try {
    const userBrandId = req.query.brandId; // Get brandId from query (frontend must send this)
    if (!userBrandId) return res.status(400).json({ message: "Brand ID is required" });

    const complaints = await ComplaintModal.find({
      brandId: userBrandId,
      status: { $in: ["COMPLETED", "FINAL VERIFICATION"] },
      cspStatus: "NO",
    });

    let totalTATCount = 0;
    let totalRTCount = 0;
    let totalCTCount = 0;
    let totalComplaints = complaints.length;

    let monthlyReport = {};
    let yearlyReport = {};

    const complaintsWithMetrics = complaints.map((c) => {
      const complaintDate = new Date(c.createdAt);
      const complaintCloseDate = c.complaintCloseTime ? new Date(c.complaintCloseTime) : null;
      const responseTime = c.empResponseTime ? new Date(c.empResponseTime) : null;

      const monthYear = complaintDate.toLocaleString("default", { month: "long", year: "numeric" });
      const year = complaintDate.getFullYear();

      let tat = getTimeDifference(complaintDate, complaintCloseDate);
      let rt = getTimeDifference(complaintDate, responseTime);
      let ct = getTimeDifference(complaintDate, complaintCloseDate);

      if (tat.days === 0 && tat.hours <= 32) totalTATCount++;
      if (rt.days === 0 && rt.hours <= 2) totalRTCount++;
      if (ct.days === 0 && ct.hours <= 32) totalCTCount++;

      // Monthly Report
      if (!monthlyReport[monthYear]) {
        monthlyReport[monthYear] = {
          complaints: [],
          tatCount: 0,
          rtCount: 0,
          ctCount: 0,
          totalComplaints: 0,
          totalCT: 0,
          totalRT: 0,
        };
      }
      monthlyReport[monthYear].complaints.push({ complaintId: c._id, ct, rt, tat });
      monthlyReport[monthYear].totalComplaints++;
      monthlyReport[monthYear].totalCT += ct.days * 32 + ct.hours;
      monthlyReport[monthYear].totalRT += rt.days * 32 + rt.hours;
      if (tat.days === 0 && tat.hours <= 32) monthlyReport[monthYear].tatCount++;
      if (rt.days === 0 && rt.hours <= 2) monthlyReport[monthYear].rtCount++;
      if (ct.days === 0 && ct.hours <= 32) monthlyReport[monthYear].ctCount++;

      // Yearly Report
      if (!yearlyReport[year]) {
        yearlyReport[year] = {
          complaints: [],
          tatCount: 0,
          rtCount: 0,
          ctCount: 0,
          totalComplaints: 0,
          totalCT: 0,
          totalRT: 0,
        };
      }
      yearlyReport[year].complaints.push({ complaintId: c._id, ct, rt, tat });
      yearlyReport[year].totalComplaints++;
      yearlyReport[year].totalCT += ct.days * 32 + ct.hours;
      yearlyReport[year].totalRT += rt.days * 32 + rt.hours;
      if (tat.days === 0 && tat.hours <= 32) yearlyReport[year].tatCount++;
      if (rt.days === 0 && rt.hours <= 2) yearlyReport[year].rtCount++;
      if (ct.days === 0 && ct.hours <= 32) yearlyReport[year].ctCount++;

      return { complaintId: c._id, ct, rt, tat };
    });

    let overallTATPercentage = calculatePercentage(totalTATCount, totalComplaints);
    let overallRTPercentage = calculatePercentage(totalRTCount, totalComplaints);
    let overallCTPercentage = calculatePercentage(totalCTCount, totalComplaints);

    const processReport = (report) =>
      Object.keys(report).map((key) => {
        let { complaints, tatCount, rtCount, ctCount, totalComplaints, totalCT, totalRT } = report[key];

        return {
          period: key,
          tatPercentage: calculatePercentage(tatCount, totalComplaints),
          rtPercentage: calculatePercentage(rtCount, totalComplaints),
          ctPercentage: calculatePercentage(ctCount, totalComplaints),
          avgCT: totalComplaints > 0 ? (totalCT / totalComplaints).toFixed(2) + " hrs" : "0.00 hrs",
          avgRT: totalComplaints > 0 ? (totalRT / totalComplaints).toFixed(2) + " hrs" : "0.00 hrs",
          complaints,
        };
      });

    let finalMonthlyReport = processReport(monthlyReport);
    let finalYearlyReport = processReport(yearlyReport);

    res.status(200).json({
      success: true,
      totalComplaints,
      overallTATPercentage,
      overallRTPercentage,
      overallCTPercentage,
      complaintsWithMetrics,
      monthlyReport: finalMonthlyReport,
      yearlyReport: finalYearlyReport,
    });

  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
router.get("/getAllTatByServiceCenter", async (req, res) => {
  try {
    const userBrandId = req.query.assignServiceCenterId; // Get brandId from query (frontend must send this)
    if (!userBrandId) return res.status(400).json({ message: "ServiceCenter ID is required" });

    const complaints = await ComplaintModal.find({
      assignServiceCenterId: userBrandId,
      status: { $in: ["COMPLETED", "FINAL VERIFICATION"] },
      cspStatus: "NO",
    });

    let totalTATCount = 0;
    let totalRTCount = 0;
    let totalCTCount = 0;
    let totalComplaints = complaints.length;

    let monthlyReport = {};
    let yearlyReport = {};

    const complaintsWithMetrics = complaints.map((c) => {
      const complaintDate = new Date(c.createdAt);
      const complaintCloseDate = c.complaintCloseTime ? new Date(c.complaintCloseTime) : null;
      const responseTime = c.serviceCenterResponseTime ? new Date(c.serviceCenterResponseTime) : null;
      const serviceStartTime = c.assignServiceCenterTime
              ? new Date(c.assignServiceCenterTime)
             : null;
      const monthYear = complaintDate.toLocaleString("default", { month: "long", year: "numeric" });
      const year = complaintDate.getFullYear();

      let tat = getTimeDifference(serviceStartTime, complaintCloseDate);
      let rt = getTimeDifference(serviceStartTime, responseTime);
      let ct = getTimeDifference(serviceStartTime, complaintCloseDate);

      if (tat.days === 0 && tat.hours <= 24) totalTATCount++;
      if (rt.days === 0 && rt.hours <= 2) totalRTCount++;
      if (ct.days === 0 && ct.hours <= 24) totalCTCount++;

      // Monthly Report
      if (!monthlyReport[monthYear]) {
        monthlyReport[monthYear] = {
          complaints: [],
          tatCount: 0,
          rtCount: 0,
          ctCount: 0,
          totalComplaints: 0,
          totalCT: 0,
          totalRT: 0,
        };
      }
      monthlyReport[monthYear].complaints.push({ complaintId: c._id, ct, rt, tat });
      monthlyReport[monthYear].totalComplaints++;
      monthlyReport[monthYear].totalCT += ct.days * 24 + ct.hours;
      monthlyReport[monthYear].totalRT += rt.days * 24 + rt.hours;
      if (tat.days === 0 && tat.hours <= 24) monthlyReport[monthYear].tatCount++;
      if (rt.days === 0 && rt.hours <= 2) monthlyReport[monthYear].rtCount++;
      if (ct.days === 0 && ct.hours <= 24) monthlyReport[monthYear].ctCount++;

      // Yearly Report
      if (!yearlyReport[year]) {
        yearlyReport[year] = {
          complaints: [],
          tatCount: 0,
          rtCount: 0,
          ctCount: 0,
          totalComplaints: 0,
          totalCT: 0,
          totalRT: 0,
        };
      }
      yearlyReport[year].complaints.push({ complaintId: c._id, ct, rt, tat });
      yearlyReport[year].totalComplaints++;
      yearlyReport[year].totalCT += ct.days * 24 + ct.hours;
      yearlyReport[year].totalRT += rt.days * 24 + rt.hours;
      if (tat.days === 0 && tat.hours <= 24) yearlyReport[year].tatCount++;
      if (rt.days === 0 && rt.hours <= 2) yearlyReport[year].rtCount++;
      if (ct.days === 0 && ct.hours <= 24) yearlyReport[year].ctCount++;

      return { complaintId: c._id, ct, rt, tat };
    });

    let overallTATPercentage = calculatePercentage(totalTATCount, totalComplaints);
    let overallRTPercentage = calculatePercentage(totalRTCount, totalComplaints);
    let overallCTPercentage = calculatePercentage(totalCTCount, totalComplaints);

    const processReport = (report) =>
      Object.keys(report).map((key) => {
        let { complaints, tatCount, rtCount, ctCount, totalComplaints, totalCT, totalRT } = report[key];

        return {
          period: key,
          tatPercentage: calculatePercentage(tatCount, totalComplaints),
          rtPercentage: calculatePercentage(rtCount, totalComplaints),
          ctPercentage: calculatePercentage(ctCount, totalComplaints),
          avgCT: totalComplaints > 0 ? (totalCT / totalComplaints).toFixed(2) + " hrs" : "0.00 hrs",
          avgRT: totalComplaints > 0 ? (totalRT / totalComplaints).toFixed(2) + " hrs" : "0.00 hrs",
          complaints,
        };
      });

    let finalMonthlyReport = processReport(monthlyReport);
    let finalYearlyReport = processReport(yearlyReport);

    res.status(200).json({
      success: true,
      totalComplaints,
      overallTATPercentage,
      overallRTPercentage,
      overallCTPercentage,
      complaintsWithMetrics,
      monthlyReport: finalMonthlyReport,
      yearlyReport: finalYearlyReport,
    });

  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
module.exports = router;











module.exports = router;
