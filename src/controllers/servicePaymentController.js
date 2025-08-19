const ServicePaymentModel = require("../models/servicePaymentModel")
const { ServiceModel } = require('../models/registration');
const ComplaintModal = require("../models/complaint")



// const addServicePayment = async (req, res) => {

//     try {
//         let body = req.body;
//         let data = new ServicePaymentModel(body);
//         await data.save();
//         res.json({ status: true, msg: "Service Payment   Added" });
//     } catch (err) {
//         res.status(400).send(err);
//     }

// };



// const addServicePayment = async (req, res) => {
//   try {
//     let body = req.body;
//     if (req.file) {
//       body.qrCode = req.file?.location; // Store the file path for qrCode
//     }

//     let data = new ServicePaymentModel(body);
//     await data.save();
//     res.json({ status: true, msg: "Service Payment Added Successfully" });
//   } catch (err) {
//     res.status(400).send({ status: false, msg: "Error while adding service payment", error: err });
//   }
// };

const addServicePayment = async (req, res) => {
  try {
    let body = req.body;

    if (req.file) {
      body.qrCode = req.file?.location; // Store the file path for qrCode
    }

    // **Check if a service payment already exists for the same serviceCenterId & complaintId**
    let existingPayment = await ServicePaymentModel.findOne({
      serviceCenterId: body.serviceCenterId,
      complaintId: body.complaintId,
    });

    if (existingPayment) {
      return res.status(400).json({
        status: false,
        msg: "Service Payment already exists for this complaint.",
      });
    }

    // **Create new service payment if no duplicate exists**
    let data = new ServicePaymentModel(body);
    await data.save();

    res.json({ status: true, msg: "Service Payment Added Successfully" });
  } catch (err) {
    console.error("Error adding service payment:", err);
    res.status(500).json({
      status: false,
      msg: "Error while adding service payment",
      error: err.message,
    });
  }
};


const getAllServicePayment = async (req, res) => {
  try {
    let data = await ServicePaymentModel.find({}).sort({ _id: -1 });
    res.send(data);
  } catch (err) {
    res.status(400).send(err);
  }
}

const getAllServicePaymentsWithPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Use lean() for faster read (returns plain JS objects instead of Mongoose documents)
    const [total, data] = await Promise.all([
      ServicePaymentModel.countDocuments(),
      ServicePaymentModel.find()
        .sort({ createdAt: -1 }) // optional sorting
        .skip(skip)
        .limit(limit)
        .lean(), // ✅ lean for performance
    ]);

    res.status(200).json({
      success: true,
      message: 'Service payments fetched successfully',
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data,
    });
  } catch (error) {
    console.error('Error in getAllServicePaymentsWithPage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service payments',
      error: error.message,
    });
  }
};



const getAllServicePaymentByCenterId = async (req, res) => {
  try {
    const serviceCenterId = req.params.id; // Assuming serviceCenterId is passed in the URL params
    // console.log("req.params",req.params);

    if (!serviceCenterId) {
      return res.status(400).send({ message: "Service Center ID is required" });
    }

    let data = await ServicePaymentModel.find({ serviceCenterId })
      .sort({ _id: -1 });

    res.send(data);
  } catch (err) {
    res.status(500).send({ message: "Internal Server Error", error: err });
  }
};
const getAllServicePaymentByCenterIdWithPage = async (req, res) => {
  try {
    const serviceCenterId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!serviceCenterId) {
      return res.status(400).json({ success: false, message: 'Service Center ID is required' });
    }

    const total = await ServicePaymentModel.countDocuments({ serviceCenterId });

    const data = await ServicePaymentModel.find({ serviceCenterId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Payments for service center fetched successfully',
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data,
    });
  } catch (err) {
    console.error('Error in getAllServicePaymentByCenterId:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
  }
};

// const searchTransactions = async (req, res) => {
//   try {
//     const {
//       searchTerm = '',
//       filterStatus = 'all',
//       filterServiceCenterType = 'allServiceCenters',
//       startDate,
//       endDate,
//       page = 1,
//       limit = 10,
//     } = req.query;

//     const filters = {};

//     if (searchTerm) {
//       const regex = new RegExp(searchTerm, 'i');
//       filters.$or = [
//         { serviceCenterName: regex },
//         { city: regex },
//         { complaintId: regex },
//         { contactNo: regex },
//       ];
//     }

//     if (filterStatus !== 'all') {
//       filters.status = filterStatus;
//     }

//     if (filterServiceCenterType !== 'allServiceCenters') {
//       filters.serviceCenterType = filterServiceCenterType;
//     }

//     if (startDate || endDate) {
//       filters.updatedAt = {};
//       if (startDate) filters.updatedAt.$gte = new Date(startDate);
//       if (endDate) filters.updatedAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
//     }

//     const pageNumber = parseInt(page, 10);
//     const pageSize = parseInt(limit, 10);

//     const totalDocs = await ServicePaymentModel.countDocuments(filters);

//     const data = await ServicePaymentModel.find(filters)
//       .skip((pageNumber - 1) * pageSize)
//       .limit(pageSize)
//       .sort({ updatedAt: -1 });

//     return res.json({
//       success: true,
//       data,
//       totalPages: Math.ceil(totalDocs / pageSize),
//       currentPage: pageNumber,
//       totalDocs,
//     });
//   } catch (error) {
//     console.error('Search transactions error:', error);
//     return res.status(500).json({ success: false, message: 'Server Error' });
//   }
// };









// const searchTransactions = async (req, res) => {
//   try {
//     const {
//       searchTerm = '',
//       filterStatus = 'all',
//       filterServiceCenterType = 'allServiceCenters',
//       startDate,
//       endDate,
//       page = 1,
//       limit = 10,
//     } = req.body;

//     console.log("📩 Incoming request body:", req.body);

//     // Base filter for ServicePaymentModel
//     const filters = {};

//     if (searchTerm.trim()) {
//       const regex = new RegExp(searchTerm, 'i');
//       filters.$or = [
//         { serviceCenterName: regex },
//         { city: regex },
//         { complaintId: regex },
//         { contactNo: regex },
//       ];
//     }

//     if (filterStatus !== 'all') {
//       filters.status = filterStatus;
//     }

//     if (startDate || endDate) {
//       filters.updatedAt = {};
//       if (startDate) filters.updatedAt.$gte = new Date(startDate);
//       if (endDate) filters.updatedAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
//     }

//     const pageNumber = Math.max(parseInt(page, 10), 1);
//     const pageSize = Math.max(parseInt(limit, 10), 1);
//     const skip = (pageNumber - 1) * pageSize;

//     // Prepare service center type filter
//     let serviceCenterTypesArray = [];
//     if (
//       filterServiceCenterType &&
//       filterServiceCenterType !== 'allServiceCenters'
//     ) {
//       if (typeof filterServiceCenterType === 'string') {
//         serviceCenterTypesArray = filterServiceCenterType.split(',').map(s => s.trim());
//       } else if (Array.isArray(filterServiceCenterType)) {
//         serviceCenterTypesArray = filterServiceCenterType;
//       }
//     }

//     console.log('Filters for ServicePayment:', filters);
//     console.log('Service Center Types to filter:', serviceCenterTypesArray);

//     // First, find all matching service center IDs by serviceCenterType if filter is active
//     let serviceCenterFilter = {};
//     if (serviceCenterTypesArray.length > 0) {
//       const matchingServiceCenters = await ServiceModel.find({
//         serviceCenterType: { $in: serviceCenterTypesArray }
//       }).select('_id');

//       const serviceCenterIds = matchingServiceCenters.map(sc => sc._id);
//       console.log('Matched ServiceCenter IDs:', serviceCenterIds);

//       // Filter payments only for these service centers
//       filters.serviceCenterId = { $in: serviceCenterIds };
//     }

//     // Get total count for pagination
//     const totalDocs = await ServicePaymentModel.countDocuments(filters);

//     // Query with pagination, sort by updatedAt descending
//     const data = await ServicePaymentModel.find(filters)
//       .populate('serviceCenterId') // assumes you have ref in schema
//       .sort({ updatedAt: -1 })
//       .skip(skip)
//       .limit(pageSize)
//       .exec();

//     console.log(`✅ Retrieved data length: ${data.length}`);
//     console.log(`📦 Total documents count: ${totalDocs}`);
//       const allMatchingDocs = await ServicePaymentModel.find(filters).select('amount status').lean();
// // console.log(`📦 allMatchingDocs: ${allMatchingDocs}`);
//     let totalPaidAmount = 0;
//     let totalUnpaidAmount = 0;

//     for (const doc of allMatchingDocs) {
//       if (doc.status === 'PAID') totalPaidAmount += doc.amount || 0;
//       else if (doc.status === 'UNPAID') totalUnpaidAmount += doc.amount || 0;
//     }

//     return res.json({
//       success: true,
//       data,
//       totalPages: Math.ceil(totalDocs / pageSize),
//       currentPage: pageNumber,
//       totalDocs,
//        totalPaidAmount,
//       totalUnpaidAmount,
//     });
//   } catch (error) {
//     console.error('🔴 Search transactions error:', error);
//     return res.status(500).json({ success: false, message: 'Server Error' });
//   }
// };

const searchTransactions = async (req, res) => {
  try {
    const {
      searchTerm = '',
      filterStatus = 'all',
      filterServiceCenterType = 'allServiceCenters',
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.body;

    const filters = {};

    // Text search
    if (searchTerm.trim()) {
      const regex = new RegExp(searchTerm, 'i');
      filters.$or = [
        { serviceCenterName: regex },
        { city: regex },
        { complaintId: regex },
        { contactNo: regex },
      ];
    }

    // Status filter
    if (filterStatus !== 'all') {
      filters.status = filterStatus;
    }

    // Date filter
    if (startDate || endDate) {
      filters.updatedAt = {};
      if (startDate) filters.updatedAt.$gte = new Date(startDate);
      if (endDate) filters.updatedAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    // Pagination setup
    const pageNumber = Math.max(parseInt(page, 10), 1);
    const pageSize = Math.max(parseInt(limit, 10), 1);
    const skip = (pageNumber - 1) * pageSize;

    // Filter by serviceCenterType
    let serviceCenterTypesArray = [];
    if (filterServiceCenterType && filterServiceCenterType !== 'allServiceCenters') {
      serviceCenterTypesArray = Array.isArray(filterServiceCenterType)
        ? filterServiceCenterType
        : filterServiceCenterType.split(',').map(s => s.trim());
    }

    if (serviceCenterTypesArray.length > 0) {
      const matchingServiceCenters = await ServiceModel.find({
        serviceCenterType: { $in: serviceCenterTypesArray }
      }).select('_id');

      const serviceCenterIds = matchingServiceCenters.map(sc => sc._id);
      filters.serviceCenterId = { $in: serviceCenterIds };
    }

    // Count for pagination
    const totalDocs = await ServicePaymentModel.countDocuments(filters);

    // Paginated data
    const data = await ServicePaymentModel.find(filters)
      .populate('serviceCenterId')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(pageSize);

    // Total Paid and Unpaid calculation
    const allMatchingDocs = await ServicePaymentModel.find(filters)
      .select('payment status')
      .lean();

    let totalPaidAmount = 0;
    let totalUnpaidAmount = 0;

    allMatchingDocs.forEach(doc => {
      const status = (doc.status || '').toLowerCase();
      const payment = Number(doc.payment) || 0;

      if (status === 'paid') {
        totalPaidAmount += payment;
      } else if (status === 'unpaid') {
        totalUnpaidAmount += payment;
      }
    });

    // Optional: Log output for verification
    // console.log("✅ Total Paid Amount:", totalPaidAmount);
    // console.log("✅ Total Unpaid Amount:", totalUnpaidAmount);

    return res.json({
      success: true,
      data,
      totalPages: Math.ceil(totalDocs / pageSize),
      currentPage: pageNumber,
      totalDocs,
      totalPaidAmount: `₹${totalPaidAmount}`,
      totalUnpaidAmount: `₹${totalUnpaidAmount}`,
    });

  } catch (error) {
    console.error('🔴 Search transactions error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};




const getServicePaymentById = async (req, res) => {
  try {
    let _id = req.params.id;
    let data = await ServicePaymentModel.findById(_id);
    res.send(data);
  } catch (err) {
    res.status(400).send(err);
  }
}

// const editServicePayment = async (req, res) => {
//     try {
//         let _id = req.params.id;
//         let body = req.body;
//         let data = await ServicePaymentModel.findByIdAndUpdate(_id, body);
//         res.json({ status: true, msg: "Service Payment Updated" });
//     } catch (err) {
//         res.status(500).send(err);
//     }
// }
// const editServicePayment = async (req, res) => {
//     try {
//       let _id = req.params.id;

//       // console.log("Transaction ID:", _id);

//       let obj = await ServicePaymentModel.findById(_id);
//       if (!obj) {
//         return res.json({ status: false, msg: "Transaction not found" });
//       }

//       // Check if file is uploaded
//       const payScreenshot = req.file?.location;
//       if (!payScreenshot) {
//         return res.status(400).json({ status: false, msg: "File upload failed" });
//       }

//       // console.log("Uploaded Screenshot URL:", payScreenshot);

//       let obj1 = await ServicePaymentModel.findByIdAndUpdate(
//         _id,
//         { payScreenshot: payScreenshot, status: "PAID" },
//         { new: true }
//       );

//       // console.log("Updated Transaction:", obj1);

//       if (!obj1) {
//         return res.json({ status: false, msg: "Payment status not updated" });
//       }


//       return res.json({ status: true, msg: "Payment status updated successfully", data: obj1 });

//     } catch (err) {
//       console.error("Error in updateTransaction:", err);
//       res.status(500).json({ status: false, msg: "Internal Server Error", error: err.message });
//     }
//   };

// const editServicePayment = async (req, res) => {
//   try {
//     let _id = req.params.id;

//     let transaction = await ServicePaymentModel.findById(_id);
//     if (!transaction) {
//       return res.json({ status: false, msg: "Transaction not found" });
//     }

//     // Check if file is uploaded
//     const payScreenshot = req.file?.location;
//     if (!payScreenshot) {
//       return res.status(400).json({ status: false, msg: "File upload failed" });
//     }

//     // Update payment status
//     let updatedTransaction = await ServicePaymentModel.findByIdAndUpdate(
//       _id,
//       { payScreenshot: payScreenshot, status: "PAID" },
//       { new: true }
//     );

//     if (!updatedTransaction) {
//       return res.json({ status: false, msg: "Payment status not updated" });
//     }

//     // Find the associated service center by service model
//     let serviceCenter = await ServiceModel.findOne({ _id: transaction?.serviceCenterId });

//     if (!serviceCenter) {
//       return res.json({ status: false, msg: "Service center not found" });
//     }

//     // Update total amount
//     serviceCenter.totalAmount = (serviceCenter.totalAmount || 0) + transaction.payment;
//     await serviceCenter.save();

//     return res.json({
//       status: true,
//       msg: "Payment status updated successfully, and totalAmount updated",
//       data: updatedTransaction,
//     });

//   } catch (err) {
//     console.error("Error in editServicePayment:", err);
//     res.status(500).json({ status: false, msg: "Internal Server Error", error: err.message });
//   }
// };
// const editServicePayment200325 = async (req, res) => {
//   try {
//     let _id = req.params.id;

//     // Find the transaction
//     let transaction = await ServicePaymentModel.findById(_id);
//     if (!transaction) {
//       return res.json({ status: false, msg: "Transaction not found" });
//     }

//     // Check if file is uploaded
//     const payScreenshot = req.file?.location;
//     if (!payScreenshot) {
//       return res.status(400).json({ status: false, msg: "File upload failed" });
//     }

//     // Find the associated service center by service model
//     let serviceCenter = await ServiceModel.findById(transaction?.serviceCenterId);
//     if (!serviceCenter) {
//       return res.json({ status: false, msg: "Service center not found" });
//     }

//     // Update total amount
//     const updatedAmount = (serviceCenter.totalAmount || 0) + transaction.payment;
//     let updatedServiceCenter = await ServiceModel.findByIdAndUpdate(
//       serviceCenter._id,
//       { totalAmount: updatedAmount },
//       { new: true }
//     );

//     if (!updatedServiceCenter) {
//       return res.json({ status: false, msg: "Failed to update total amount in Service Center" });
//     }

//     // If service center amount update is successful, update transaction status
//     let updatedTransaction = await ServicePaymentModel.findByIdAndUpdate(
//       _id,
//       { payScreenshot: payScreenshot, status: "PAID" },
//       { new: true }
//     );

//     if (!updatedTransaction) {
//       return res.json({ status: false, msg: "Payment status not updated" });
//     }

//     return res.json({
//       status: true,
//       msg: "Payment status updated successfully, and totalAmount updated in Service Center.",
//       data: updatedTransaction,
//     });

//   } catch (err) {
//     console.error("Error in editServicePayment:", err);
//     res.status(500).json({ status: false, msg: "Internal Server Error", error: err.message });
//   }
// };
const editServicePayment = async (req, res) => {
  try {
    let _id = req.params.id;

    // Find the transaction
    let transaction = await ServicePaymentModel.findById(_id);
    if (!transaction) {
      return res.status(404).json({ status: false, msg: "Transaction not found" });
    }

    // Ensure the transaction has a valid service center ID
    if (!transaction.serviceCenterId) {
      return res.status(400).json({ status: false, msg: "Transaction has no associated service center" });
    }

    // Check if file is uploaded
    const payScreenshot = req.file?.location;
    if (!payScreenshot) {
      return res.status(400).json({ status: false, msg: "File upload failed or missing" });
    }

    // Find the associated service center
    // let serviceCenter = await ServiceModel.findById(transaction.serviceCenterId);
    // if (!serviceCenter) {
    //   return res.status(404).json({ status: false, msg: "Service center not found" });
    // }

    // // Ensure `totalAmount` and `transaction.payment` are numbers
    // const totalAmount = Number(serviceCenter.totalAmount || 0);
    // const transactionPayment = Number(transaction.payment || 0);

    // if (isNaN(transactionPayment)) {
    //   return res.status(400).json({ status: false, msg: "Invalid transaction payment amount" });
    // }

    // const updatedAmount = totalAmount + transactionPayment;

    // // Update service center total amount
    // let updatedServiceCenter = await ServiceModel.findByIdAndUpdate(
    //   serviceCenter._id,
    //   { totalAmount: updatedAmount },
    //   { new: true }
    // );

    // if (!updatedServiceCenter) {
    //   return res.status(500).json({ status: false, msg: "Failed to update total amount in Service Center" });
    // }

    const updatedComplaint = await ComplaintModal.findByIdAndUpdate(
      transaction.complaintId,
      { $set: { paymentServiceCenter: Number(transaction?.payment || 0) } },
      { new: true }
    );
    if (!updatedComplaint) {
      return res.status(500).json({ status: false, msg: "Complaint not found" });
    }
    // Update transaction status and add payment screenshot
    let updatedTransaction = await ServicePaymentModel.findByIdAndUpdate(
      _id,
      { payScreenshot: payScreenshot, status: "PAID" },
      { new: true }
    );

    if (!updatedTransaction) {
      return res.status(500).json({ status: false, msg: "Payment status not updated" });
    }

    return res.status(200).json({
      status: true,
      msg: "Payment status updated successfully, and totalAmount updated in Service Center.",
      data: updatedTransaction,
    });

  } catch (err) {
    console.error("Error in editServicePayment:", err);
    res.status(500).json({ status: false, msg: "Internal Server Error", error: err.message });
  }
};

const updateBulkPayments = async (req, res) => {
  const { ids } = req.body;
  try {
    await ServicePaymentModel.updateMany(
      { _id: { $in: ids }, status: "UNPAID" },
      { $set: { status: "PAID" } }
    );
    res.status(200).json({
      status: true,
      msg: "Payment status updated successfully, and totalAmount updated in Service Center."
    })
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Something went wrong' });
  }
}

const deleteServicePayment = async (req, res) => {
  try {
    let _id = req.params.id;
    let data = await ServicePaymentModel.findByIdAndDelete(_id);
    res.json({ status: true, msg: "Service Payment Deteled" });
  } catch (err) {
    res.status(500).send(err);
  }
}

module.exports = { addServicePayment, getAllServicePayment, getAllServicePaymentsWithPage, searchTransactions, getAllServicePaymentByCenterIdWithPage, getAllServicePaymentByCenterId, getServicePaymentById, editServicePayment, updateBulkPayments, deleteServicePayment };
