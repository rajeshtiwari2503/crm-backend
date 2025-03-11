const express = require('express');
const router = express.Router();
const  ComplaintModal  = require('../models/complaint');
const { BrandRegistrationModel, ServiceModel, TechnicianModal, UserModel } = require('../models/registration');
const  ProductModel  = require('../models/product');
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
   } );

  //  router.post('/filterData', async (req, res) => {
  //   try {
  //     const { reportType, startDate, endDate, filters, includeCharts } = req.body;
  // console.log(filters);
  //     let query = {};
  //     let dateQuery = {};
  
  //     if (startDate && endDate) {
  //       dateQuery.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  //     }
  
  //     if (reportType === 'USER') {
  //       const userTypes = Object.keys(filters.userType).filter(type => filters.userType[type]);
  //       let responseData = {};
  
  //       if (userTypes.includes('customer')) {
  //         const customers = await UserModel.find(dateQuery);
  //         responseData.customers = customers;
  //       }
  
  //       if (userTypes.includes('serviceCenter')) {
  //         const serviceCenters = await ServiceModel.find(dateQuery);
  //         responseData.serviceCenters = serviceCenters;
  //       }
  
  //       if (userTypes.includes('technician')) {
  //         const technicians = await TechnicianModal.find(dateQuery);
  //         responseData.technicians = technicians;
  //       }
  
  //       if (userTypes.includes('brand')) {
  //         const brands = await BrandRegistrationModel.find(dateQuery);
  //         responseData.brands = brands;
  //       }
  
  //       return res.json({ summary: 'User Report', data: responseData });
  //     }
  
  //     if (reportType === 'COMPLAINT') {
  //       if (filters.status) {
  //         const statuses = Object.keys(filters.status).filter(status => filters.status[status]);
  //         if (statuses.length) {
  //           query.status = { $in: statuses };
  //         }
  //       }
  
  //       if (filters.product && filters.product.length > 0) {
  //         const products = await ProductModel.find({ _id: { $in: filters.product } });
  //         console.log("products found:", products);
  //         const productIds = products.map(product => product._id);
  //         if (productIds.length > 0) {
  //           query.productId = { $in: productIds };
  //         } else {
  //           return res.json({ summary: 'Complaint Report', complaints: [] });
  //         }
  //       }
  
  //       if (filters.brand.length) {
  //         const brands = await BrandRegistrationModel.find({ name: { $in: filters.brand } });
  //         const brandIds = brands.map(brand => brand._id);
  //         if (brandIds.length) {
  //           query.brandId = { $in: brandIds };
  //         } else {
  //           return res.json({ summary: 'Complaint Report', complaints: [] });
  //         }
  //       }
  
  //       if (filters.serviceCenter.length) {
  //         const services = await ServiceModel.find({ name: { $in: filters.serviceCenter } });
  //         const serviceIds = services.map(service => service._id);
  //         if (serviceIds.length) {
  //           query.serviceCenterId = { $in: serviceIds };
  //         } else {
  //           return res.json({ summary: 'Complaint Report', complaints: [] });
  //         }
  //       }
  
  //       if (filters.technician.length) {
  //         const technicians = await TechnicianModal.find({ name: { $in: filters.technician } });
  //         const technicianIds = technicians.map(technician => technician._id);
  //         if (technicianIds.length) {
  //           query.technicianId = { $in: technicianIds };
  //         } else {
  //           return res.json({ summary: 'Complaint Report', complaints: [] });
  //         }
  //       }
  
  //       if (filters.country) {
  //         query.country = filters.country;
  //       }
  
  //       if (filters.state) {
  //         query.state = filters.state;
  //       }
  
  //       if (filters.city) {
  //         query.city = filters.city;
  //       }
  
  //       if (startDate && endDate) {
  //         query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  //       }
  
  //       const complaints = await ComplaintModal.find(query);
  //       const reportData = {
  //         summary: `Report from ${startDate} to ${endDate}`,
  //         complaints: complaints,
  //         labels: [], // Populate as necessary for charts
  //         data: [], // Populate as necessary for charts
  //       };
  
  //       return res.json(reportData);
  //     }
  
  //     res.status(400).json({ error: 'Invalid report type' });
  //   } catch (error) {
  //     console.error('Error filtering data:', error);
  //     res.status(500).json({ error: 'Internal Server Error' });
  //   }
  // });
  
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


 
  
  router.post('/filterData', async (req, res) => {
    try {
      const { reportType, startDate, endDate, filters } = req.body;
      const brandId = Array.isArray(req?.body?.filters?.brand) && req.body.filters.brand.length === 0 
  ? null 
  : req?.body?.filters?.brand;

      const userRole = req?.body?.filters?.userRole || null;
  // console.log(userRole);
  // console.log("req.body",req.body);
  // console.log("brandId",brandId);
      let query = {};
      let dateQuery = {};
  
      // Apply date filter if startDate and endDate are provided
      if (startDate && endDate) {
        dateQuery.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
  
      // Handle USER Report
      if (reportType === 'USER') {
        const userTypes = Object.keys(filters.userType).filter(type => filters.userType[type]);
        let responseData = {};
        // Fetch complaints filtered by brandId if provided
      if(userRole==="BRAND") {
        const complaints = await ComplaintModal.find(brandId ? { brandId, ...dateQuery } : dateQuery);
  
        // Extract unique user IDs from complaints
        const userIds = [...new Set(complaints.map((complaint) => complaint.userId))];
  
        // Find users who match the extracted user IDs
        const customers = await UserModel.find({ _id: { $in: userIds } });
        
        if(customers)
        {
          responseData.customers = customers;
        }
      } else{
        if (userTypes.includes('customer')) {
          const customers = await UserModel.find(dateQuery);
          responseData.customers = customers;
        }
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
        // Create report data with labels and data for charts (if required)
        // const reportData = {
        //   summary: `User Report from ${startDate} to ${endDate}`,
        //   customers,
        //   totalCustomers: customers.length,
        //   labels: ['Customer Count'],
        //   data: [customers.length] // Example: Count of customers for charting
        // };
  
        return res.json({ summary: 'User Report', data: responseData });
      }
  
      // Handle COMPLAINT Report
      if (reportType === 'COMPLAINT') {
        // Add additional filters for complaints
        if (filters.status) {
          const statuses = Object.keys(filters.status).filter((key) => filters.status[key]);
          if (statuses.length) {
            query.status = { $in: statuses };
          }
        }
  
        if (filters.product && filters.product.length > 0) {
          query.productId = { $in: filters.product };
        }
  
        if (filters.serviceCenter && filters.serviceCenter.length > 0) {
          query.assignServiceCenterId = { $in: filters.serviceCenter };
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
  
        // Apply brandId filter if provided
        if (brandId) {
          query.brandId = brandId;
          console.log("brandId",brandId);
          
        }
  
        // Apply date filter
        if (startDate && endDate) {
          query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
  
        // Fetch complaints based on the query
        const complaints = await ComplaintModal.find(query);
  
        // Example: Group complaints by status for chart labels and data
        const groupedByStatus = complaints.reduce((acc, complaint) => {
          const status = complaint.status;
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});
  
        // Prepare labels and data for charts
        const labels = Object.keys(groupedByStatus);
        const data = Object.values(groupedByStatus);
  
        // Create report data with labels and data for charts
        const reportData = {
          summary: `Complaint Report from ${startDate} to ${endDate}`,
          complaints,
          labels,
          data
        };
  
        return res.json(reportData);
      }
  
      // If no valid report type is provided
      res.status(400).json({ error: 'Invalid report type' });
    } catch (error) {
      console.error('Error filtering data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  
  
  
// router.post("/getFilteredComplaintsByBrand", async (req, res) => {
//   try {
//       const { userData, startDate, endDate, selectedStatuses } = req.body;

//       if (!userData) {
//           return res.status(400).json({status:false, msg: "User data is required." });
//       }

//       const brandId = userData.role === "BRAND" ? userData._id : userData.brandId;

//       // Build query dynamically
//       const query = { brandId };
//       if (startDate) query.startDate = { $gte: new Date(startDate) };
//       if (endDate) query.endDate = { $lte: new Date(endDate) };
//       if (selectedStatuses?.length) query.status = { $in: selectedStatuses };

//       // Fetch complaints from the database
//       const complaints = await ComplaintModal.find(query);

//       res.status(200).json(complaints);
//   } catch (error) {
//       console.error("Error fetching complaints:", error);
//       res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// });
  

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
