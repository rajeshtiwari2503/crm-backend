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
const addServicePayment = async (req, res) => {
  try {
    let body = req.body;
    if (req.file) {
      body.qrCode = req.file?.location; // Store the file path for qrCode
    }

    let data = new ServicePaymentModel(body);
    await data.save();
    res.json({ status: true, msg: "Service Payment Added Successfully" });
  } catch (err) {
    res.status(400).send({ status: false, msg: "Error while adding service payment", error: err });
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
    let serviceCenter = await ServiceModel.findById(transaction.serviceCenterId);
    if (!serviceCenter) {
      return res.status(404).json({ status: false, msg: "Service center not found" });
    }

    // Ensure `totalAmount` and `transaction.payment` are numbers
    const totalAmount = Number(serviceCenter.totalAmount || 0);
    const transactionPayment = Number(transaction.payment || 0);

    if (isNaN(transactionPayment)) {
      return res.status(400).json({ status: false, msg: "Invalid transaction payment amount" });
    }

    const updatedAmount = totalAmount + transactionPayment;

    // Update service center total amount
    let updatedServiceCenter = await ServiceModel.findByIdAndUpdate(
      serviceCenter._id,
      { totalAmount: updatedAmount },
      { new: true }
    );

    if (!updatedServiceCenter) {
      return res.status(500).json({ status: false, msg: "Failed to update total amount in Service Center" });
    }

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

const deleteServicePayment = async (req, res) => {
  try {
    let _id = req.params.id;
    let data = await ServicePaymentModel.findByIdAndDelete(_id);
    res.json({ status: true, msg: "Service Payment Deteled" });
  } catch (err) {
    res.status(500).send(err);
  }
}

module.exports = { addServicePayment, getAllServicePayment, getServicePaymentById, editServicePayment, deleteServicePayment };
