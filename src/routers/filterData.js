const express = require('express');
const router = express.Router();
const ComplaintModal = require('../models/complaint');
const { BrandRegistrationModel, ServiceModel, TechnicianModal, UserModel } = require('../models/registration');
const ProductModel = require('../models/product');
router.post('/filterUserData', async (req, res) => {
  try {
    const { reportType, startDate, endDate, filters, includeCharts } = req.body;
    //   console.log('Received payload:', req.body);

    let query = {};

    if (reportType === 'USER') {
      const userTypes = Object.keys(filters.userType).filter(type => filters.userType[type]);
      let responseData = {};
      let dateQuery = {};

      // Create date range query if both startDate and endDate are provided
      if (startDate && endDate) {
        dateQuery = {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        };
      }

      if (userTypes.includes('customer')) {
        const customers = await UserModel.find(dateQuery);
        responseData.customers = customers;
      }

      if (userTypes.includes('serviceCenter')) {
        const serviceCenters = await ServiceModel.find(dateQuery);
        responseData.serviceCenters = serviceCenters;
      }

      if (userTypes.includes('technician')) {
        const technicians = await TechnicianModal.find(dateQuery);
        responseData.technicians = technicians;
      }

      if (userTypes.includes('brand')) {
        const brands = await BrandRegistrationModel.find(dateQuery);
        responseData.brands = brands;
      }

      return res.json({ summary: 'User Report', data: responseData });
    }
  }
  catch (error) {
    console.error('Error filtering data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

 
router.post('/filterDataOld', async (req, res) => {
  try {
    const { reportType, startDate, endDate, filters, includeCharts } = req.body;
    // console.log(filters);

    let query = {};
    let dateQuery = {};

    if (startDate && endDate) {
      dateQuery.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    if (reportType === 'USER') {
      const userTypes = Object.keys(filters.userType).filter(type => filters.userType[type]);
      let responseData = {};

      if (userTypes.includes('customer')) {
        const customers = await UserModel.find(dateQuery);
        responseData.customers = customers;
      }

      if (userTypes.includes('serviceCenter')) {
        const serviceCenters = await ServiceModel.find(dateQuery);
        responseData.serviceCenters = serviceCenters;
      }

      if (userTypes.includes('technician')) {
        const technicians = await TechnicianModal.find(dateQuery);
        responseData.technicians = technicians;
      }

      if (userTypes.includes('brand')) {
        const brands = await BrandRegistrationModel.find(dateQuery);
        responseData.brands = brands;
      }

      return res.json({ summary: 'User Report', data: responseData });
    }

    if (reportType === 'COMPLAINT') {
      if (filters.status) {
        const statuses = Object.keys(filters.status).filter(status => filters.status[status]);
        if (statuses.length) {
          query.status = { $in: statuses };
        }
      }

      if (filters.product && filters.product.length > 0) {
        query.productId = { $in: filters.product };
      }

      if (filters.brand && filters.brand.length > 0) {
        query.brandId = { $in: filters.brand };
      }

      if (filters.serviceCenter && filters.serviceCenter.length > 0) {
        query.assignServiceCenterId = { $in: filters.assignServiceCenterId };
      }

      if (filters.technician && filters.technician.length > 0) {
        query.technicianId = { $in: filters.technician };
      }

      if (filters.country) {
        query.country = filters.country;
      }

      if (filters.state) {
        query.state = filters.state;
      }

      if (filters.city) {
        query.city = filters.city;
      }

      if (startDate && endDate) {
        query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }

      // console.log("Final query:", query);
      const complaints = await ComplaintModal.find(query);
      // console.log("complaints found:", complaints);
      const reportData = {
        summary: `Report from ${startDate} to ${endDate}`,
        complaints: complaints,
        labels: [], // Populate as necessary for charts
        data: [], // Populate as necessary for charts
      };

      return res.json(reportData);
    }

    res.status(400).json({ error: 'Invalid report type' });
  } catch (error) {
    console.error('Error filtering data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


 
 
// edit 06Oct2025
// router.post('/filterData', async (req, res) => {
//   try {
//     const { reportType, startDate, endDate, filters } = req.body;

//     // const end = new Date(endDate);
//     // end.setHours(23, 59, 59, 999);
//     const end = new Date(endDate);
//     end.setDate(end.getDate() + 1);
//     end.setHours(0, 0, 0, 0);
//     // Step 1: Get all active brand IDs
//     const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" })
//       .select("_id")
//       .lean();
//     const activeBrandIds = activeBrands.map(b => b._id.toString());

//     const brandId =
//       Array.isArray(filters?.brand) && filters.brand.length === 0
//         ? null
//         : filters?.brand;

//     const userRole = filters?.userRole || null;

//     //enddate=end

//     const dateQuery =
//       startDate && endDate
//         ? { createdAt: { $gte: new Date(startDate), $lte: end } }
//         : {};

//     // USER REPORT
//     if (reportType === 'USER') {
//       const userTypes = Object.keys(filters?.userType || {}).filter(
//         type => filters.userType[type]
//       );

//       const responseData = {};

//       if (userRole === 'BRAND') {
//         const complaints = await ComplaintModal.find(
//           brandId ? { brandId, ...dateQuery } : dateQuery,
//           { userId: 1 }
//         ).lean();

//         const userIds = [...new Set(complaints.map(c => c.userId?.toString()))];

//         if (userIds.length) {
//           const customers = await UserModel.find({ _id: { $in: userIds } }).lean();
//           responseData.customers = customers;
//         }
//       } else {
//         const userQueries = [];

//         if (userTypes.includes('customer')) {
//           userQueries.push(
//             UserModel.find(dateQuery).lean().then(data => (responseData.customers = data))
//           );
//         }

//         if (userTypes.includes('serviceCenter')) {
//           userQueries.push(
//             ServiceModel.find(dateQuery).lean().then(data => (responseData.serviceCenters = data))
//           );
//         }

//         if (userTypes.includes('technician')) {
//           userQueries.push(
//             TechnicianModal.find(dateQuery).lean().then(data => (responseData.technicians = data))
//           );
//         }

//         if (userTypes.includes('brand')) {
//           userQueries.push(
//             BrandRegistrationModel.find(dateQuery).lean().then(data => (responseData.brands = data))
//           );
//         }

//         await Promise.all(userQueries);
//       }

//       return res.json({ summary: 'User Report', data: responseData });
//     }

//     // COMPLAINT REPORT
//     if (reportType === 'COMPLAINT') {
//       const query = { ...dateQuery };

//       if (filters.status) {
//         const statuses = Object.keys(filters.status).filter(k => filters.status[k]);
//         if (statuses.length) query.status = { $in: statuses };
//       }

//       if (filters.product?.length) {
//         query.productId = { $in: filters.product };
//       }

//       if (filters.serviceCenter?.length) {
//         query.assignServiceCenterId = { $in: filters.serviceCenter };
//       }

//       if (filters.technician?.length) {
//         query.technicianId = { $in: filters.technician };
//       }

//       if (filters.country) query.country = filters.country;
//       if (filters.state) query.state = filters.state;
//       if (filters.city) query.city = filters.city;

//       // Apply brand filter: either selected, or all active brands
//       if (brandId && brandId.length) {
//         // Filter provided brand IDs to include only those that are ACTIVE
//         const filteredBrandIds = brandId.filter(id => activeBrandIds.includes(id));
//         query.brandId = { $in: filteredBrandIds };
//       } else {
//         // Default to all ACTIVE brand IDs
//         query.brandId = { $in: activeBrandIds };
//       }


//       const complaints = await ComplaintModal.find(query).lean();

//       const groupedByStatus = complaints.reduce((acc, { status }) => {
//         acc[status] = (acc[status] || 0) + 1;
//         return acc;
//       }, {});

//       const labels = Object.keys(groupedByStatus);
//       const data = Object.values(groupedByStatus);

//       return res.json({
//         summary: `Complaint Report from ${startDate} to ${endDate}`,
//         complaints,
//         labels,
//         data
//       });
//     }

//     res.status(400).json({ error: 'Invalid report type' });
//   } catch (error) {
//     console.error('Error filtering data:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

 router.post('/filterData', async (req, res) => {
  try {
    const { reportType, startDate, endDate, filters } = req.body;

    // const end = new Date(endDate);
    // end.setHours(23, 59, 59, 999);
    const end = new Date(endDate);
    end.setDate(end.getDate() );
    end.setHours(23, 59, 59, 999);

    console.log("startDate",startDate);
    console.log("endDate",endDate);
    console.log("end",end);
    
    // Step 1: Get all active brand IDs
    const activeBrands = await BrandRegistrationModel.find({ status: "ACTIVE" })
      .select("_id")
      .lean();
    const activeBrandIds = activeBrands.map(b => b._id.toString());

    const brandId =
      Array.isArray(filters?.brand) && filters.brand.length === 0
        ? null
        : filters?.brand;

    const userRole = filters?.userRole || null;

    //enddate=end

    const dateQuery =
      startDate && endDate
        ? { createdAt: { $gte: new Date(startDate), $lte: end } }
        : {};
 

    // USER REPORT
    if (reportType === 'USER') {
      const userTypes = Object.keys(filters?.userType || {}).filter(
        type => filters.userType[type]
      );

      const responseData = {};

      if (userRole === 'BRAND') {
        const complaints = await ComplaintModal.find(
          brandId ? { brandId, ...dateQuery } : dateQuery,
          { userId: 1 }
        ).lean();

        const userIds = [...new Set(complaints.map(c => c.userId?.toString()))];

        if (userIds.length) {
          const customers = await UserModel.find({ _id: { $in: userIds } }).lean();
          responseData.customers = customers;
        }
      } else {
        const userQueries = [];

        if (userTypes.includes('customer')) {
          userQueries.push(
            UserModel.find(dateQuery).lean().then(data => (responseData.customers = data))
          );
        }

        if (userTypes.includes('serviceCenter')) {
          userQueries.push(
            ServiceModel.find(dateQuery).lean().then(data => (responseData.serviceCenters = data))
          );
        }

        if (userTypes.includes('technician')) {
          userQueries.push(
            TechnicianModal.find(dateQuery).lean().then(data => (responseData.technicians = data))
          );
        }

        if (userTypes.includes('brand')) {
          userQueries.push(
            BrandRegistrationModel.find(dateQuery).lean().then(data => (responseData.brands = data))
          );
        }

        await Promise.all(userQueries);
      }

      return res.json({ summary: 'User Report', data: responseData });
    }

    // COMPLAINT REPORT
    if (reportType === 'COMPLAINT') {
      const query = { ...dateQuery };

      if (filters.status) {
        const statuses = Object.keys(filters.status).filter(k => filters.status[k]);
        if (statuses.length) query.status = { $in: statuses };
      }

      if (filters.product?.length) {
        query.productId = { $in: filters.product };
      }

      if (filters.serviceCenter?.length) {
        query.assignServiceCenterId = { $in: filters.serviceCenter };
      }

      if (filters.technician?.length) {
        query.technicianId = { $in: filters.technician };
      }

      if (filters.country) query.country = filters.country;
      if (filters.state) query.state = filters.state;
      if (filters.city) query.city = filters.city;

      // Apply brand filter: either selected, or all active brands
      if (brandId && brandId.length) {
        // Filter provided brand IDs to include only those that are ACTIVE
        const filteredBrandIds = brandId.filter(id => activeBrandIds.includes(id));
        query.brandId = { $in: filteredBrandIds };
      } else {
        // Default to all ACTIVE brand IDs
        query.brandId = { $in: activeBrandIds };
      }


      const complaints = await ComplaintModal.find(query).lean();

      const groupedByStatus = complaints.reduce((acc, { status }) => {
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const labels = Object.keys(groupedByStatus);
      const data = Object.values(groupedByStatus);

      return res.json({
        summary: `Complaint Report from ${startDate} to ${endDate}`,
        complaints,
        labels,
        data
      });
    }

    res.status(400).json({ error: 'Invalid report type' });
  } catch (error) {
    console.error('Error filtering data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post("/getFilteredComplaintsByBrand", async (req, res) => {
  try {
    const { userData, startDate, endDate, selectedStatuses } = req.body;

    if (!userData) {
      return res.status(400).json({ status: false, msg: "User data is required." });
    }

    const brandId = userData.role === "BRAND" ? userData._id : userData.brandId;

    // Build query dynamically
    const query = { brandId };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        let adjustedEndDate = new Date(endDate);
        adjustedEndDate.setHours(23, 59, 59, 999); // Ensure it includes the full day
        query.createdAt.$lte = adjustedEndDate;
      }
    }

    if (selectedStatuses?.length) {
      query.status = { $in: selectedStatuses };
    }

    // Fetch complaints from the database
    const complaints = await ComplaintModal.find(query);

    res.status(200).json(complaints);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});
router.post("/getFilteredComplaintsByDealer", async (req, res) => {
  try {
    const { userData, startDate, endDate, selectedStatuses } = req.body;

    if (!userData) {
      return res.status(400).json({ status: false, msg: "User data is required." });
    }

    const dealerId = userData.role === "DEALER" ? userData._id : userData.dealerId;

    // Build query dynamically
    const query = { dealerId };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        let adjustedEndDate = new Date(endDate);
        adjustedEndDate.setHours(23, 59, 59, 999); // Ensure it includes the full day
        query.createdAt.$lte = adjustedEndDate;
      }
    }

    if (selectedStatuses?.length) {
      query.status = { $in: selectedStatuses };
    }

    // Fetch complaints from the database
    const complaints = await ComplaintModal.find(query);

    res.status(200).json(complaints);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});
router.post("/getFilteredComplaintsByServiceCenter", async (req, res) => {
  try {
    const { userData, startDate, endDate, selectedStatuses } = req.body;

    if (!userData) {
      return res.status(400).json({ status: false, msg: "User data is required." });
    }

    const assignServiceCenterId = userData.role === "SERVICE" ? userData._id : userData?._id;

    // Build query dynamically
    const query = { assignServiceCenterId };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        let adjustedEndDate = new Date(endDate);
        adjustedEndDate.setHours(23, 59, 59, 999); // Ensure it includes the full day
        query.createdAt.$lte = adjustedEndDate;
      }
    }

    if (selectedStatuses?.length) {
      query.status = { $in: selectedStatuses };
    }

    // Fetch complaints from the database
    const complaints = await ComplaintModal.find(query);

    res.status(200).json(complaints);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;









router.post('/filterData11', async (req, res) => {
  try {
    const { reportType, startDate, endDate, filters } = req.body;
    console.log('Received payload:', req.body);

    if (reportType === 'USER') {
      const userTypes = Object.keys(filters.userType).filter(type => filters.userType[type]);
      let responseData = {};
      let dateQuery = {};

      // Create date range query if both startDate and endDate are provided
      if (startDate && endDate) {
        dateQuery = {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        };
      }

      if (userTypes.includes('customer')) {
        const customers = await UserModel.find(dateQuery);
        responseData.customers = customers;
      }

      if (userTypes.includes('serviceCenter')) {
        const serviceCenters = await ServiceModel.find(dateQuery);
        responseData.serviceCenters = serviceCenters;
      }

      if (userTypes.includes('technician')) {
        const technicians = await TechnicianModal.find(dateQuery);
        responseData.technicians = technicians;
      }

      if (userTypes.includes('brand')) {
        const brands = await BrandRegistrationModel.find(dateQuery);
        responseData.brands = brands;
      }

      return res.json({ summary: 'User Report', data: responseData });
    }

    res.status(400).json({ error: 'Invalid report type' });
  } catch (error) {
    console.error('Error filtering data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;
