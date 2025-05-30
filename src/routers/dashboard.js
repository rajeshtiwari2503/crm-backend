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
const ServiceCenterDepositModal = require("../models/serviceCenterDepositModel");
const OrderModel = require("../models/order");



router.get("/dashboardDetails", async (req, res) => {
  try {
    const { now, oneDayAgo, fiveDaysAgo, todayStart } = calculateDateRanges();
    const datetoday = new Date();
    datetoday.setHours(23, 59, 59, 999);

    // Step 1: Get active brand IDs
    const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }).select("_id");
    const activeBrandIds = activeBrands.map(brand => brand._id);

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
      complaintsCreatedToday,
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

      // Complaint Stats (filtered by active brand)
      Complaints.countDocuments({ brandId: { $in: activeBrandIds } }),
      Complaints.countDocuments({ status: 'IN PROGRESS', brandId: { $in: activeBrandIds } }),
      Complaints.countDocuments({ status: 'ASSIGN', brandId: { $in: activeBrandIds } }),
      Complaints.countDocuments({ status: 'PENDING', brandId: { $in: activeBrandIds } }),
      Complaints.countDocuments({ status: 'COMPLETED', brandId: { $in: activeBrandIds } }),
      Complaints.countDocuments({ status: 'CANCELED', brandId: { $in: activeBrandIds } }),
      Complaints.countDocuments({ status: 'PART PENDING', brandId: { $in: activeBrandIds } }),
      Complaints.countDocuments({ status: 'CUSTOMER SIDE PENDING', brandId: { $in: activeBrandIds } }),
      Complaints.countDocuments({ status: 'FINAL VERIFICATION', brandId: { $in: activeBrandIds } }),

      Complaints.countDocuments({
        $or: [{ status: 'PENDING' }, { status: 'IN PROGRESS' }, { status: 'ASSIGN' }, { status: 'PART PENDING' }, { status: 'CUSTOMER SIDE PENDING' }],
        createdAt: { $gte: oneDayAgo },
        brandId: { $in: activeBrandIds }
      }),
      Complaints.countDocuments({
        $or: [{ status: 'PENDING' }, { status: 'IN PROGRESS' }, { status: 'ASSIGN' }, { status: 'PART PENDING' }, { status: 'CUSTOMER SIDE PENDING' }],
        createdAt: { $gte: fiveDaysAgo, $lt: oneDayAgo },
        brandId: { $in: activeBrandIds }
      }),
      Complaints.countDocuments({
        $or: [{ status: 'PENDING' }, { status: 'IN PROGRESS' }, { status: 'ASSIGN' }, { status: 'PART PENDING' }, { status: 'CUSTOMER SIDE PENDING' }],
        createdAt: { $lt: fiveDaysAgo },
        brandId: { $in: activeBrandIds }
      }),
      Complaints.countDocuments({
        $or: [{ status: 'FINAL VERIFICATION' }, { status: 'COMPLETED' }],
        updatedAt: { $gte: todayStart },
        brandId: { $in: activeBrandIds }
      }),
      Complaints.countDocuments({
        createdAt: { $gte: todayStart, $lte: datetoday },
        brandId: { $in: activeBrandIds }
      }),

      Complaints.countDocuments({
        status: 'PART PENDING',
        createdAt: { $gte: oneDayAgo },
        brandId: { $in: activeBrandIds }
      }),
      Complaints.countDocuments({
        status: 'PART PENDING',
        createdAt: { $gte: fiveDaysAgo, $lt: oneDayAgo },
        brandId: { $in: activeBrandIds }
      }),
      Complaints.countDocuments({
        status: 'PART PENDING',
        createdAt: { $lt: fiveDaysAgo },
        brandId: { $in: activeBrandIds }
      }),

      Complaints.countDocuments({
        preferredServiceDate: { $gte: datetoday },
        status: { $nin: ["COMPLETED", "FINAL VERIFICATION", "CANCELED"] },
        brandId: { $in: activeBrandIds }
      }),

      Complaints.countDocuments({
        preferredServiceDate: { $lt: todayStart },
        status: { $nin: ["COMPLETED", "FINAL VERIFICATION", "CANCELED"] },
        brandId: { $in: activeBrandIds }
      }),

      ServicePayment.countDocuments({}),
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
        createdToday: complaintsCreatedToday,
        zeroToOneDaysPartPending: complaints0To1PartPendingDays,
        twoToFiveDaysPartPending: complaints2To5PartPendingDays,
        moreThanFiveDaysPartPending: complaintsMoreThan5PartPendingDays,
        completedToday: complaintsCompletedToday,
        schedule: schedule,
        scheduleUpcomming: scheduleUpcomming,
      },
      centerPayment,
      centerPaidPayment,
      centerUnPaidPayment,
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




router.post("/dashboardDetailsByEmployeeStateZone", async (req, res) => {
  try {
    const { now, oneDayAgo, fiveDaysAgo, todayStart } = calculateDateRanges();
    const { stateZone = [], brand = [] } = req.body;
    const datetoday = new Date();
    datetoday.setHours(23, 59, 59, 999);

    // 🔍 Optional filters
    const filters = [];

    // Filter by stateZone
    if (Array.isArray(stateZone) && stateZone.length > 0) {
      filters.push({
        $or: [
          { state: { $in: stateZone.map(zone => zone.trim()) } },
          { state: { $elemMatch: { $in: stateZone.map(zone => zone.trim()) } } },
        ]
      });
    }

    // Filter by ACTIVE brandId only
    const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }, "_id");
    const activeBrandIds = activeBrands.map(brand => brand._id.toString());

    let filteredBrandIds = activeBrandIds;

    if (Array.isArray(brand) && brand.length > 0) {
      const selectedBrandIds = brand.map(b => b.value);
      filteredBrandIds = activeBrandIds.filter(id => selectedBrandIds.includes(id));
    }

    if (filteredBrandIds.length > 0) {
      filters.push({
        brandId: { $in: filteredBrandIds }
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
        status: { $in: ["PENDING", "IN PROGRESS", "PART PENDING", "ASSIGN", "CUSTOMER SIDE PENDING"] },
        createdAt: { $gte: new Date(oneDayAgo) },
      },
      twoToFiveDays: {
        status: { $in: ["PENDING", "IN PROGRESS", "PART PENDING", "ASSIGN", "CUSTOMER SIDE PENDING"] },
        createdAt: { $gte: new Date(fiveDaysAgo), $lt: new Date(oneDayAgo) },
      },
      moreThanFiveDays: {
        status: { $in: ["PENDING", "IN PROGRESS", "PART PENDING", "ASSIGN", "CUSTOMER SIDE PENDING"] },
        createdAt: { $lt: new Date(fiveDaysAgo) },
      },
      completedToday: {
        $or: [{ status: 'FINAL VERIFICATION' }, { status: 'COMPLETED' }],
        updatedAt: { $gte: todayStart }
      },
      createdToday: {
        createdAt: { $gte: todayStart, $lte: datetoday }
      },
      zeroToOneDaysPartPending: {
        status: "PART PENDING",
        createdAt: { $gte: oneDayAgo }
      },
      twoToFiveDaysPartPending: {
        status: "PART PENDING",
        createdAt: { $gte: fiveDaysAgo, $lt: oneDayAgo },
      },
      moreThanFiveDaysPartPending: {
        status: "PART PENDING",
        createdAt: { $lt: fiveDaysAgo }
      },
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
      scheduleUpcomming,

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
      Complaints.countDocuments({ ...query, status: { $in: ["PENDING", "IN PROGRESS", "PART PENDING", "ASSIGN", "CUSTOMER SIDE PENDING"] }, createdAt: { $gte: oneDayAgo } }),
      Complaints.countDocuments({ ...query, status: { $in: ["PENDING", "IN PROGRESS", "PART PENDING", "ASSIGN", "CUSTOMER SIDE PENDING"] }, createdAt: { $gte: fiveDaysAgo, $lt: oneDayAgo } }),
      Complaints.countDocuments({ ...query, status: { $in: ["PENDING", "IN PROGRESS", "PART PENDING", "ASSIGN", "CUSTOMER SIDE PENDING"] }, createdAt: { $lt: fiveDaysAgo } }),

      Complaints.countDocuments({ ...query, status: 'PART PENDING', createdAt: { $gte: oneDayAgo } }),
      Complaints.countDocuments({ ...query, status: 'PART PENDING', createdAt: { $gte: fiveDaysAgo, $lt: oneDayAgo } }),
      Complaints.countDocuments({ ...query, status: 'PART PENDING', createdAt: { $lt: fiveDaysAgo } }),
      Complaints.countDocuments({
        ...query,
        $or: [

          { ...query, preferredServiceDate: { $gte: datetoday }, status: { $nin: ["COMPLETED", "FINAL VERIFICATION", "CANCELED"] } } // Past but not completed/canceled
        ]
      }),
      Complaints.countDocuments({
        $or: [

          { ...query, preferredServiceDate: { $lt: todayStart }, status: { $nin: ["COMPLETED", "FINAL VERIFICATION", "CANCELED"] } } // Past but not completed/canceled
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
      Complaints.countDocuments({ ...query, status: 'FINAL VERIFICATION' }),

    ]);

    // Return aggregated data as JSON response
    res.json({

      complaints: {
        totalAmount,
        walletAmount: serviceCenterWallet?.totalCommission,
        allComplaints: allComplaintCount,
        inProgress: complaintNewCount,
        assign: complaintAssignCount,
        pending: complaintPendingCount,
        complete: complaintCompleteCount,
        cancel: complaintCancelCount,
        partPending: complaintPartPendingCount,
        customerSidePending: complaintCustomerSidePendingCount,
        finalVerification: complaintFinalVerificationCount,
        schedule: schedule,
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
      createdTodayCount,
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
        status: { $in: ["PENDING", "IN PROGRESS", "PART PENDING", "ASSIGN", "CUSTOMER SIDE PENDING"] },
        createdAt: { $gte: oneDayAgo }
      }),

      // Complaints in 2-5 days
      Complaints.countDocuments({
        ...query,
        status: { $in: ["PENDING", "IN PROGRESS", "PART PENDING", "ASSIGN", "CUSTOMER SIDE PENDING"] },
        createdAt: { $gte: fiveDaysAgo, $lt: oneDayAgo }
      }),

      // Complaints older than 5 days
      Complaints.countDocuments({
        ...query,
        status: { $in: ["PENDING", "IN PROGRESS", "PART PENDING", "ASSIGN", "CUSTOMER SIDE PENDING"] },
        createdAt: { $lt: fiveDaysAgoEnd }
      }),
      Complaints.countDocuments({ ...query, $or: [{ status: 'FINAL VERIFICATION' }, { status: 'COMPLETED' }], updatedAt: { $gte: todayStart } }),
      Complaints.countDocuments({ ...query, createdAt: { $gte: todayStart, $lte: datetoday } }),
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
        completedToday: completedTodayCount,
        createdToday: createdTodayCount,
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
    const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }).select("_id").lean();
    const activeBrandIds = activeBrands.map(b => b._id.toString());



    // Step 2: Aggregate complaints with desired statuses and active brands
    const complaints = await ComplaintModal.aggregate([
      {
        $match: {
          status: { $in: ["PENDING", "IN PROGRESS", "PART PENDING", "ASSIGN", "CUSTOMER SIDE PENDING"] },
          brandId: { $in: activeBrandIds }
        }
      },  // Filter to include only pending complaints
      { $group: { _id: "$state", count: { $sum: 1 } } }, // Group by state and count
      { $sort: { count: -1 } }
    ]);

    res.status(200).json(complaints);  // Send response with aggregated data
  } catch (error) {
    console.error('Error fetching state-wide pending complaints:', error);
    res.status(500).json({ error: 'Error fetching state-wide pending complaints' });
  }
});

 

// router.post("/getStatewiseBrandData", async (req, res) => {
//   try {
//     const { brand, state, city, startDate, endDate } = req.body;
//     const matchStage = {};

//     if (brand) matchStage.brand = brand;
//     if (state) matchStage.state = state;
//     if (city) matchStage.city = city;
//     if (startDate && endDate) {
//       matchStage.createdAt = {
//         $gte: new Date(startDate),
//         $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
//       };
//     }

//     const groupedData = await Complaints.aggregate([
//       { $match: matchStage },
//       {
//         $group: {
//           _id: {
//             brandName: "$productBrand",
//             state: "$state",
//             district: "$district", // assuming `city` is used as district
//             date: {
//               $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
//             }
//           },
//           count: { $sum: 1 }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           brandName: "$_id.brandName",
//           state: "$_id.state",
//           district: "$_id.district",
//           date: "$_id.date",
//           count: 1
//         }
//       },
//       { $sort: { date: -1 } }
//     ]);

//     res.json({ chartData: groupedData });
//   } catch (error) {
//     console.error("Error generating chart data:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });



router.get("/getStatewiseBrandData", async (req, res) => {
  try {
    // Step 1: Get all ACTIVE brand names
    const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }).select("brandName").lean();
    const activeBrandNames = activeBrands.map(b => b.brandName);

    // console.log("Active Brands:", activeBrands);
    // console.log("Active Brand Names:", activeBrandNames);

    // Step 2: Aggregate complaint data only for active brands
    const groupedData = await Complaints.aggregate([
      {
        $match: {
          productBrand: { $in: activeBrandNames }
        }
      },
      {
        $group: {
          _id: {
            brandName: "$productBrand",
            state: "$state",
            district: "$district",
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          brandName: "$_id.brandName",
          state: "$_id.state",
          district: "$_id.district",
          date: "$_id.date",
          count: 1
        }
      },
      { $sort: { date: -1 } }
    ]);

    if (!groupedData.length) {
      console.warn("No complaints found for active brands.");
      return res.status(404).json({ message: "No complaints found for active brands." });
    }

    res.status(200).json({ chartData: groupedData });

  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



// router.get('/getDistrictWisePendingComplaints', async (req, res) => {
//   try {
//     // Aggregation pipeline to get count of pending complaints by state and district
//     const complaints = await Complaints.aggregate([
//       {
//         $match: { status: 'PENDING' }  // Filter to include only pending complaints
//       },
//       {
//         $group: {
//           _id: { state: "$state", district: "$district" },  // Group by state and district
//           count: { $sum: 1 }  // Count the number of complaints
//         }
//       },
//       {
//         $sort: { "count": -1 }  // Sort by count in descending order
//       }
//     ]);

//     // Transform the output to a more readable format (optional)
//     const transformedComplaints = complaints.map(item => ({
//       state: item._id.state,
//       district: item._id.district,
//       count: item.count
//     }));

//     res.status(200).json(transformedComplaints);  // Send response with aggregated data
//   } catch (error) {
//     console.error('Error fetching district-wise pending complaints:', error);
//     res.status(500).json({ error: 'Error fetching district-wise pending complaints' });
//   }
// });

router.get('/getDistrictWisePendingComplaints', async (req, res) => {
  try {
    // Step 1: Get ACTIVE brand IDs
    const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }).select("_id").lean();
    const activeBrandIds = activeBrands.map(b => b._id.toString());



    // Step 2: Aggregate complaints with desired statuses and active brands
    const complaints = await ComplaintModal.aggregate([
      {
        $match: {
          status: { $in: ["PENDING", "IN PROGRESS", "PART PENDING", "ASSIGN", "CUSTOMER SIDE PENDING"] },
          brandId: { $in: activeBrandIds }
        }
      },
      {
        $group: {
          _id: { state: "$state", district: "$district" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Step 3: Transform result
    const transformedComplaints = complaints.map(item => ({
      state: item._id.state,
      district: item._id.district,
      count: item.count
    }));

    res.status(200).json(transformedComplaints);
  } catch (error) {
    console.error('Error fetching district-wise pending complaints:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/getServiceCenterWisePendingComplaints', async (req, res) => {
  try {
    const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }).select("_id").lean();
    const activeBrandIds = activeBrands.map(b => b._id.toString());



    // Step 2: Aggregate complaints with desired statuses and active brands
    const complaints = await ComplaintModal.aggregate([
      {
        $match: {
          status: { $in: ["PENDING", "IN PROGRESS", "PART PENDING", "ASSIGN", "CUSTOMER SIDE PENDING"] },
          assignServiceCenter: { $ne: null },
          brandId: { $in: activeBrandIds }
        }
      },
      // { $match: { status: 'PENDING', assignServiceCenter: { $ne: null } } }, // Filter to include only pending complaints with a valid service center
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
    const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }).select("_id").lean();
    const activeBrandIds = activeBrands.map(b => b._id.toString());



    // Step 2: Aggregate complaints with desired statuses and active brands
    const complaints = await ComplaintModal.aggregate([
      { $match: { status: 'PENDING', assignServiceCenter: { $exists: false }, brandId: { $in: activeBrandIds } } },  // Filter for pending complaints without service center
      { $project: { fullName: 1, district: 1, state: 1, phoneNumber: 1 } }                             // Project only userName and district fields
    ]);

    res.status(200).json(complaints);  // Send response with list of complaints
  } catch (error) {
    console.error('Error fetching no serviceable area complaints:', error);
    res.status(500).json({ error: 'Error fetching no serviceable area complaints' });
  }
});



// router.get('/getComplaintInsights', async (req, res) => {
//   try {
//     const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }).select("_id").lean();
//     const activeBrandIds = activeBrands.map(b => b._id.toString());

//     const [
//       complaintsByBrand,
//       complaintsByLocationAndProduct,
//       commonFaults,
//       pendingComplaintsByBrand
//     ] = await Promise.all([
//       // 1. Complaints by brand (filtered by active brands)
//       Complaints.aggregate([
//         { $match: { brandId: { $in: activeBrandIds } } },
//         { $group: { _id: "$productBrand", count: { $sum: 1 } } },
//         { $sort: { count: -1 } }
//       ]),
//       // 2. Complaints by location and product (filtered by active brands)
//       Complaints.aggregate([
//         { $match: { brandId: { $in: activeBrandIds } } },
//         {
//           $group: {
//             _id: { product: "$productName", productBrand: "$productBrand" },
//             count: { $sum: 1 }
//           }
//         },
//         { $sort: { count: -1 } }
//       ]),
//       // 3. Most common faults (filtered by active brands)
//       Complaints.aggregate([
//         { $match: { brandId: { $in: activeBrandIds } } },
//         { $unwind: { path: "$issueType", preserveNullAndEmptyArrays: true } },
//         {
//           $group: {
//             _id: "$issueType",
//             productBrand: { $first: "$productBrand" },
//             count: { $sum: 1 }
//           }
//         },
//         { $sort: { count: -1 } }
//       ]),
//       // 4. Pending complaints by brand (filtered by active brands)
//       Complaints.aggregate([
//         {
//           $match: {
//             status: "PENDING",
//             brandId: { $in: activeBrandIds }
//           }
//         },
//         { $group: { _id: "$productBrand", count: { $sum: 1 } } },
//         { $sort: { count: -1 } }
//       ])
//     ]);

//     res.status(200).json({
//       complaintsByBrand,
//       complaintsByLocationAndProduct,
//       commonFaults,
//       pendingComplaintsByBrand
//     });
//   } catch (error) {
//     console.error('Error fetching complaint insights:', error);
//     res.status(500).json({ error: 'Error fetching complaint insights' });
//   }
// });

router.get('/getComplaintInsights', async (req, res) => {
  try {
    const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }).select("_id").lean();
    const activeBrandIds = activeBrands.map(b => b._id.toString());

    const [
      complaintsByBrand,
      complaintsByLocationAndProduct,
      commonFaults,
      pendingComplaintsByBrand,
      complaintsByStateAndDistrict
    ] = await Promise.all([
      // 1. Complaints by brand
      Complaints.aggregate([
        { $match: { brandId: { $in: activeBrandIds } } },
        { $group: { _id: "$productBrand", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // 2. Complaints by product + productBrand
      Complaints.aggregate([
        { $match: { brandId: { $in: activeBrandIds } } },
        {
          $group: {
            _id: { product: "$productName", productBrand: "$productBrand" },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),

      Complaints.aggregate([
        {
          $match: {
            brandId: { $in: activeBrandIds }
          }
        },
        {
          $addFields: {
            issue: {
              $cond: {
                if: {
                  $and: [
                    { $isArray: "$issueType" },
                    { $gt: [{ $size: "$issueType" }, 0] }
                  ]
                },
                then: { $arrayElemAt: ["$issueType", 0] },
                else: "$detailedDescription"
              }
            }
          }
        },
        {
          $group: {
            _id: "$issue",
            productBrand: { $first: "$productBrand" },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]),



      // 4. Pending complaints by brand
      Complaints.aggregate([
        {
          $match: {
            status: "PENDING",
            brandId: { $in: activeBrandIds }
          }
        },
        { $group: { _id: "$productBrand", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // ✅ 5. Complaints by State and District
      Complaints.aggregate([
        {
          $match: {
            brandId: { $in: activeBrandIds }
          }
        },
        {
          $addFields: {
            issue: {
              $cond: {
                if: {
                  $and: [
                    { $isArray: "$issueType" },
                    { $gt: [{ $size: "$issueType" }, 0] }
                  ]
                },
                then: { $arrayElemAt: ["$issueType", 0] },
                else: "$detailedDescription"
              }
            }
          }
        },

        {
          $group: {
            _id: {
              issue: "$issue",
              state: "$state",
              district: "$district",
              productBrand: "$productBrand",
              productName: "$productName"
            },
            productBrand: { $first: "$productBrand" },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ])

    ]);

    res.status(200).json({
      complaintsByBrand,
      complaintsByLocationAndProduct,
      commonFaults,
      pendingComplaintsByBrand,
      complaintsByStateAndDistrict
    });
  } catch (error) {
    console.error('Error fetching complaint insights:', error);
    res.status(500).json({ error: 'Error fetching complaint insights' });
  }
});

router.get('/getAllUnAssignComplaint', async (req, res) => {
  try {
    const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }).select("_id").lean();
    const activeBrandIds = activeBrands.map(b => b._id.toString());
    const unassignedComplaints = await Complaints.find({
      $or: [
        { assignServiceCenterId: null },
        { assignServiceCenterId: { $exists: false } }
      ],
      status: { $in: ["PENDING", "IN PROGRESS", "PART PENDING"] },// Filtering based on status
      brandId: { $in: activeBrandIds }
    });

    res.status(200).json({ success: true, data: unassignedComplaints });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error retrieving complaints", error });
  }
});



// router.get('/getComplaintCountByCityState', async (req, res) => {
//   try {

//     const complaintCounts = await Complaints.aggregate([
//       {
//         $group: {
//           _id: { city: "$district" }, // Group by city (district)
//           TOTAL: { $sum: 1 },
//           state: { $first: "$state" },  
//           PENDING: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "PENDING"] }, 1, 0] } },
//           INPROGRESS: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "IN PROGRESS"] }, 1, 0] } },
//           PART_PENDING: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "PART PENDING"] }, 1, 0] } },
//           ASSIGN: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "ASSIGN"] }, 1, 0] } },
//           CANCEL: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "CANCELED"] }, 1, 0] } },
//           COMPLETE: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "COMPLETED"] }, 1, 0] } },
//           FINAL_VERIFICATION: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "FINAL VERIFICATION"] }, 1, 0] } }
//         }
//       },
//       {
//         $addFields: {
//           ACTIVE_COUNT: {
//             $add: ["$PENDING", "$INPROGRESS", "$PART_PENDING", "$ASSIGN"]
//           }
//         }
//       },
//       {
//         $sort: {
//           ACTIVE_COUNT: -1, // First sort by combined count of key statuses
//           PENDING: -1,
//           INPROGRESS: -1,
//           PART_PENDING: -1,
//           ASSIGN: -1
//         } 
//       } 
//     ]);

//     res.status(200).json({ success: true, data: complaintCounts });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Error retrieving complaints", error });
//   }
// });


router.get('/getComplaintCountByCityState', async (req, res) => {
  try {
    const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }).select("_id").lean();
    const activeBrandIds = activeBrands.map(b => b._id.toString());

    const complaintCounts = await Complaints.aggregate([
      {
        $match: {
          brandId: { $in: activeBrandIds }
        }
      },
      {
        $group: {
          _id: { city: "$district" }, // Group by city (district)
          TOTAL: { $sum: 1 },
          state: { $first: "$state" },
          TOTAL: { $sum: 1 },
          PENDING: {
            $sum: {
              $cond: [
                { $eq: [{ $toUpper: "$status" }, "PENDING"] },
                1,
                0
              ]
            }
          },
          INPROGRESS: {
            $sum: {
              $cond: [
                { $eq: [{ $toUpper: "$status" }, "IN PROGRESS"] },
                1,
                0
              ]
            }
          },
          PART_PENDING: {
            $sum: {
              $cond: [
                { $eq: [{ $toUpper: "$status" }, "PART PENDING"] },
                1,
                0
              ]
            }
          },
          CUSTOMER_SIDE_PENDING: {
            $sum: {
              $cond: [
                { $eq: [{ $toUpper: "$status" }, "CUSTOMER SIDE PENDING"] },
                1,
                0
              ]
            }
          },
          ASSIGN: {
            $sum: {
              $cond: [
                { $eq: [{ $toUpper: "$status" }, "ASSIGN"] },
                1,
                0
              ]
            }
          },
          CANCEL: {
            $sum: {
              $cond: [
                { $eq: [{ $toUpper: "$status" }, "CANCELED"] },
                1,
                0
              ]
            }
          },
          COMPLETE: {
            $sum: {
              $cond: [
                { $eq: [{ $toUpper: "$status" }, "COMPLETED"] },
                1,
                0
              ]
            }
          },
          FINAL_VERIFICATION: {
            $sum: {
              $cond: [
                { $eq: [{ $toUpper: "$status" }, "FINAL VERIFICATION"] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $addFields: {
          ACTIVE_COUNT: {
            $add: ["$PENDING", "$INPROGRESS", "$PART_PENDING", "$ASSIGN", "$CUSTOMER_SIDE_PENDING"]
          }
        }
      },
      {
        $sort: {
          ACTIVE_COUNT: -1,
          PENDING: -1,
          INPROGRESS: -1,
          PART_PENDING: -1,
          CUSTOMER_SIDE_PENDING: -1,
          ASSIGN: -1
        }
      }
    ]);

    res.status(200).json({ success: true, data: complaintCounts });
  } catch (error) {
    console.error("Error fetching complaint counts by city/state:", error);
    res.status(500).json({ success: false, message: "Error retrieving complaints", error });
  }
});



router.get("/getComplaintCountByServiceCenter", async (req, res) => {
  try {

    const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }).select("_id").lean();
    const activeBrandIds = activeBrands.map(b => b._id.toString());
    const complaintCounts = await Complaints.aggregate([
      {
        $match: { assignServiceCenterId: { $ne: null }, brandId: { $in: activeBrandIds } } // Exclude complaints without assignServiceCenterId
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
          CUSTOMER_SIDE_PENDING: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "CUSTOMER SIDE PENDING"] }, 1, 0] } },
          ASSIGN: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "ASSIGN"] }, 1, 0] } },
          CANCEL: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "CANCELED"] }, 1, 0] } },
          COMPLETE: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "COMPLETED"] }, 1, 0] } },
          FINAL_VERIFICATION: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "FINAL VERIFICATION"] }, 1, 0] } }
        }

      },
      {
        $addFields: {
          ACTIVE_COUNT: {
            $add: ["$PENDING", "$INPROGRESS", "$PART_PENDING", "$ASSIGN", "$CUSTOMER_SIDE_PENDING"]
          }
        }
      },
      {
        $sort: {
          ACTIVE_COUNT: -1, // First sort by combined count of key statuses
          PENDING: -1,
          INPROGRESS: -1,
          PART_PENDING: -1,
          CUSTOMER_SIDE_PENDING: -1,
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



// router.get('/getComplaintCountByBrand', async (req, res) => {
//   try {
//      const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }).select("_id").lean();
//     const activeBrandIds = activeBrands.map(b => b._id.toString());
//     const complaintCounts = await Complaints.aggregate([
//       {
//         $group: {
//           _id: { brandId: "$brandId" }, // Group by city (district)
//           TOTAL: { $sum: 1 },
//           productBrand: { $first: "$productBrand" },  
//           PENDING: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "PENDING"] }, 1, 0] } },
//           INPROGRESS: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "IN PROGRESS"] }, 1, 0] } },
//           PART_PENDING: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "PART PENDING"] }, 1, 0] } },
//           ASSIGN: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "ASSIGN"] }, 1, 0] } },
//           CANCEL: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "CANCELED"] }, 1, 0] } },
//           COMPLETE: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "COMPLETED"] }, 1, 0] } },
//           FINAL_VERIFICATION: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "FINAL VERIFICATION"] }, 1, 0] } }
//         }
//       },
//       {
//         $sort: { PENDING: -1 } // Sort by PENDING complaints in descending order
//       } 
//     ]);



//     res.status(200).json({ success: true, data: complaintCounts });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Error retrieving complaints", error });
//   }
// });




// Helper function to calculate time difference

router.get('/getComplaintCountByBrand', async (req, res) => {
  try {
    const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" }).select("_id productBrand").lean();
    const activeBrandIds = activeBrands.map(b => b._id.toString());

    const complaintCounts = await Complaints.aggregate([
      {
        $match: {
          brandId: { $in: activeBrandIds }
        }
      },
      {
        $group: {
          _id: "$brandId", // Group by brandId
          TOTAL: { $sum: 1 },
          productBrand: { $first: "$productBrand" },
          PENDING: {
            $sum: {
              $cond: [
                { $eq: [{ $toUpper: "$status" }, "PENDING"] },
                1,
                0
              ]
            }
          },
          INPROGRESS: {
            $sum: {
              $cond: [
                { $eq: [{ $toUpper: "$status" }, "IN PROGRESS"] },
                1,
                0
              ]
            }
          },
          PART_PENDING: {
            $sum: {
              $cond: [
                { $eq: [{ $toUpper: "$status" }, "PART PENDING"] },
                1,
                0
              ]
            }
          },
          CUSTOMER_SIDE_PENDING: {
            $sum: {
              $cond: [
                { $eq: [{ $toUpper: "$status" }, "CUSTOMER SIDE PENDING"] },
                1,
                0
              ]
            }
          },
          ASSIGN: {
            $sum: {
              $cond: [
                { $eq: [{ $toUpper: "$status" }, "ASSIGN"] },
                1,
                0
              ]
            }
          },
          CANCEL: {
            $sum: {
              $cond: [
                { $eq: [{ $toUpper: "$status" }, "CANCELED"] },
                1,
                0
              ]
            }
          },
          COMPLETE: {
            $sum: {
              $cond: [
                { $eq: [{ $toUpper: "$status" }, "COMPLETED"] },
                1,
                0
              ]
            }
          },
          FINAL_VERIFICATION: {
            $sum: {
              $cond: [
                { $eq: [{ $toUpper: "$status" }, "FINAL VERIFICATION"] },
                1,
                0
              ]
            }
          }
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
          ACTIVE_COUNT: -1,
          PENDING: -1
        }
      }
    ]);

    res.status(200).json({ success: true, data: complaintCounts });
  } catch (error) {
    console.error("Error retrieving complaints by brand:", error);
    res.status(500).json({ success: false, message: "Error retrieving complaints", error });
  }
});



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







router.get('/getOrderPriceAndDepositsByServiceCenter/:serviceCenterId', async (req, res) => {
  try {
    const { serviceCenterId } = req.params;
    // console.log("serviceCenterId", serviceCenterId);

    // 1. Get all orders for the service center
    const orderData = await OrderModel.find({ serviceCenterId: serviceCenterId }).lean();

    // Total order price
    // const totalOrderPrice = orderData.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const totalOrderPrice = orderData.reduce((sum, order) => {
      const partsTotal = order.spareParts.reduce((partSum, part) => {
        return partSum + ((part.price || 0));
      }, 0);
      return sum + partsTotal;
    }, 0);

    // Categorize orders
    const order = orderData.filter(f => f.status === "ORDER");
    const approveOrder = order.filter(f => f.brandApproval === "APPROVED");
    const notApproveOrder = order.filter(f => f.brandApproval === "NOT_APPROVE");
    const cancelOrder = orderData.filter(f => f.status === "OrderCanceled");

    // 2. Get total deposit for the service center
    const depositAggregation = await ServiceCenterDepositModal.aggregate([
      {
        $match: { serviceCenterId: serviceCenterId }  // Match by plain string
      },
      {
        $group: {
          _id: null,
          totalDeposit: { $sum: "$payAmount" },
        }
      }
    ]);

    const totalDeposit = depositAggregation[0]?.totalDeposit || 0;

    res.status(200).json({
      totalOrderPrice,
      totalDeposit,
      orderCount: order.length,
      approvedOrderCount: approveOrder.length,
      notApprovedOrderCount: notApproveOrder.length,
      canceledOrderCount: cancelOrder.length,
      totalOrders: orderData.length
    });

  } catch (error) {
    console.error("Error fetching order price and deposits:", error);
    res.status(500).json({ error: 'Error fetching order price and deposits' });
  }
});





// router.get('/getAllServiceCenterOrdersAndDepositsAnalytics', async (req, res) => {
//   try {
//     const serviceCenters = await ServiceModel.find().lean();

//     const summaries = await Promise.all(serviceCenters.map(async (center) => {
//       const serviceCenterId = center._id.toString();

//       const [orderData, depositAggregation] = await Promise.all([
//         OrderModel.find({ serviceCenterId }).lean(),
//         ServiceCenterDepositModal.aggregate([
//           {
//             $match: { serviceCenterId }
//           },
//           {
//             $group: {
//               _id: null,
//               totalDeposit: { $sum: "$payAmount" }
//             }
//           }
//         ])
//       ]);

//       const totalOrderPrice = orderData.reduce((sum, order) => {
//         const partsTotal = order.spareParts?.reduce((partSum, part) => {
//           return partSum + (part.price || 0);
//         }, 0) || 0;
//         return sum + partsTotal;
//       }, 0);

//       const order = orderData.filter(f => f.status === "ORDER");
//       const approveOrder = order.filter(f => f.brandApproval === "APPROVED");
//       const notApproveOrder = order.filter(f => f.brandApproval === "NOT_APPROVE");
//       const cancelOrder = orderData.filter(f => f.status === "OrderCanceled");

//       return {
//         serviceCenterId,
//         serviceCenterName: center.serviceCenterName || "Unknown",
//         totalOrderPrice,
//         totalDeposit: depositAggregation[0]?.totalDeposit || 0,
//         orderCount: order.length,
//         approvedOrderCount: approveOrder.length,
//         notApprovedOrderCount: notApproveOrder.length,
//         canceledOrderCount: cancelOrder.length,
//         totalOrders: orderData.length
//       };
//     }));

//     // Aggregate global totals
//     const result = summaries.reduce(
//       (acc, summary) => {
//         acc.totalOrderPriceAll += summary.totalOrderPrice;
//         acc.totalDepositAll += summary.totalDeposit;
//         acc.totalOrdersAll += summary.totalOrders;
//         acc.orderCountAll += summary.orderCount;
//         acc.approvedOrderCountAll += summary.approvedOrderCount;
//         acc.notApprovedOrderCountAll += summary.notApprovedOrderCount;
//         acc.canceledOrderCountAll += summary.canceledOrderCount;
//         return acc;
//       },
//       {
//         totalOrderPriceAll: 0,
//         totalDepositAll: 0,
//         totalOrdersAll: 0,
//         orderCountAll: 0,
//         approvedOrderCountAll: 0,
//         notApprovedOrderCountAll: 0,
//         canceledOrderCountAll: 0
//       }
//     );

//     result.serviceCenters = summaries;

//     res.status(200).json(result);

//   } catch (error) {
//     console.error("Error fetching data:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

router.get('/getAllServiceCenterOrdersAndDepositsAnalytics', async (req, res) => {
  try {
    // Step 1: Get only service centers with type "Authorized" or "Franchise"
    const serviceCenters = await ServiceModel.find({
      serviceCenterType: { $in: ["Authorized", "Franchise"] }
    }).lean();

    // Step 2: Process each center's data
    const summaries = await Promise.all(serviceCenters.map(async (center) => {
      const serviceCenterId = center._id.toString();

      const [orderData, depositAggregation] = await Promise.all([
        OrderModel.find({ serviceCenterId }).lean(),
        ServiceCenterDepositModal.aggregate([
          { $match: { serviceCenterId } },
          { $group: { _id: null, totalDeposit: { $sum: "$payAmount" } } }
        ])
      ]);

      // Skip if no orders and no deposit
      if (orderData.length === 0 && (!depositAggregation[0] || depositAggregation[0].totalDeposit === 0)) {
        return null;
      }

      const totalOrderPrice = orderData.reduce((sum, order) => {
        const partsTotal = order.spareParts?.reduce((partSum, part) => {
          return partSum + (part.price || 0);
        }, 0) || 0;
        return sum + partsTotal;
      }, 0);

      const order = orderData.filter(f => f.status === "ORDER");
      const approveOrder = order.filter(f => f.brandApproval === "APPROVED");
      const notApproveOrder = order.filter(f => f.brandApproval === "NOT_APPROVE");
      const cancelOrder = orderData.filter(f => f.status === "OrderCanceled");

      return {
        serviceCenterId,
        serviceCenterName: center.serviceCenterName || "Unknown",
        totalOrderPrice,
        totalDeposit: depositAggregation[0]?.totalDeposit || 0,
        orderCount: order.length,
        approvedOrderCount: approveOrder.length,
        notApprovedOrderCount: notApproveOrder.length,
        canceledOrderCount: cancelOrder.length,
        totalOrders: orderData.length
      };
    }));

    // Filter out null summaries
    const filteredSummaries = summaries.filter(Boolean);

    // Step 3: Aggregate global totals
    const result = filteredSummaries.reduce(
      (acc, summary) => {
        acc.totalOrderPriceAll += summary.totalOrderPrice;
        acc.totalDepositAll += summary.totalDeposit;
        acc.totalOrdersAll += summary.totalOrders;
        acc.orderCountAll += summary.orderCount;
        acc.approvedOrderCountAll += summary.approvedOrderCount;
        acc.notApprovedOrderCountAll += summary.notApprovedOrderCount;
        acc.canceledOrderCountAll += summary.canceledOrderCount;
        return acc;
      },
      {
        totalOrderPriceAll: 0,
        totalDepositAll: 0,
        totalOrdersAll: 0,
        orderCountAll: 0,
        approvedOrderCountAll: 0,
        notApprovedOrderCountAll: 0,
        canceledOrderCountAll: 0
      }
    );

    result.serviceCenters = filteredSummaries;

    res.status(200).json(result);

  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



router.get('/getAllServiceCenterOrdersAndDeposits', async (req, res) => {
  try {
    const serviceCenters = await ServiceModel.find().lean();

    const summaries = await Promise.all(serviceCenters.map(async (center) => {
      const serviceCenterId = center._id.toString();

      const [orderData, depositAggregation] = await Promise.all([
        OrderModel.find({ serviceCenterId }).lean(),
        ServiceCenterDepositModal.aggregate([
          {
            $match: { serviceCenterId }
          },
          {
            $group: {
              _id: null,
              totalDeposit: { $sum: "$payAmount" }
            }
          }
        ])
      ]);

      const totalOrderPrice = orderData.reduce((sum, order) => {
        const partsTotal = order.spareParts?.reduce((partSum, part) => {
          return partSum + (part.price || 0);
        }, 0) || 0;
        return sum + partsTotal;
      }, 0);

      const order = orderData.filter(f => f.status === "ORDER");
      const approveOrder = order.filter(f => f.brandApproval === "APPROVED");
      const notApproveOrder = order.filter(f => f.brandApproval === "NOT_APPROVE");
      const cancelOrder = orderData.filter(f => f.status === "OrderCanceled");

      return {
        totalOrderPrice,
        totalDeposit: depositAggregation[0]?.totalDeposit || 0,
        orderCount: order.length,
        approvedOrderCount: approveOrder.length,
        notApprovedOrderCount: notApproveOrder.length,
        canceledOrderCount: cancelOrder.length,
        totalOrders: orderData.length
      };
    }));

    // Aggregate global totals
    const totals = summaries.reduce(
      (acc, summary) => {
        acc.totalOrderPriceAll += summary.totalOrderPrice;
        acc.totalDepositAll += summary.totalDeposit;
        acc.totalOrdersAll += summary.totalOrders;
        acc.orderCountAll += summary.orderCount;
        acc.approvedOrderCountAll += summary.approvedOrderCount;
        acc.notApprovedOrderCountAll += summary.notApprovedOrderCount;
        acc.canceledOrderCountAll += summary.canceledOrderCount;
        return acc;
      },
      {
        totalOrderPriceAll: 0,
        totalDepositAll: 0,
        totalOrdersAll: 0,
        orderCountAll: 0,
        approvedOrderCountAll: 0,
        notApprovedOrderCountAll: 0,
        canceledOrderCountAll: 0
      }
    );

    res.status(200).json(totals);

  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});







module.exports = router;
