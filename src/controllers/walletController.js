const WalletModel = require("../models/wallet")
const BankDetail = require("../models/bankDetails");
const BankTransactionModel = require("../models/bankTransaction");
const { default: axios } = require("axios");
const NotificationModel = require("../models/notification")
const { ServiceModel } = require('../models/registration');
// const addWallet = async (req, res) => {
//   try {
//     const { serviceCenterName } = req.body;

//     // Check if the spare part name already exists
//     const existingserviceCente = await WalletModel.findOne({ serviceCenterName });
//     if (existingserviceCente) {
//       return res.json({ status: false, msg: "Service Center already exists in Wallets" });
//     }

//     // If not, proceed to add the new spare part
//     const walletData = new WalletModel(req.body);

// console.log(walletData);
//     const contactData = {
//       name: req.body.accountHolderName,
//       email: req.body.email,
//       contact: req.body.contact,
//       type: "employee",
//       reference_id: "Acme Contact ID 12345",
//       notes: {
//         random_key_1: "Make it so.",
//         random_key_2: "Tea. Earl Grey. Hot."
//       }
//     }
//     let response = await axios.post("https://api.razorpay.com/v1/contacts", contactData, { headers: { Authorization: "Basic " + new Buffer.from(process.env.RAZORPAYX_KEY_ID + ":" + process.env.RAZORPAYX_KEY_SECRET).toString("base64") } });
//     const { data } = response;
//     console.log("contacts data",data);
//     // cont_OY1HeeDKMAT7YO
//     if (data) {
//       const fundData = {
//         name: req.body.accountHolderName,
//         email: req.body.email,
//         contact: req.body.contact,
//         account_type: "bank_account",
//         // contact_id: data.id,
//         contact_id:  "cont_OY1HeeDKMAT7YO",

//       }
//     }
//       let response1 = await axios.post("https://api.razorpay.com/v1/fund_accounts", fundData, { headers: { Authorization: "Basic " + new Buffer.from(process.env.RAZORPAYX_KEY_ID + ":" + process.env.RAZORPAYX_KEY_SECRET).toString("base64") } });
//       const { data } = response1;
//       console.log("fund_accounts data",data);
//       const walletDetails = await BankDetail.findById(req.body.bankDetailId);
//       console.log("walletDetails data",walletDetails);

//       if (!walletDetails) {
//         return res.status(404).json({ status: false, msg: 'Bank Detail not found' });
//       }

//       walletDetails.fund_account_id =  data.fund_account_id;
//       await walletDetails.save();
//       res.send(data);

//     res.send(data);
//     await walletData.save();
//     res.json({ status: true, msg: "Wallet Added" });
//   } catch (err) {
//     res.status(400).send(err);
//   }
// };

const addWallet = async (req, res) => {
  try {
    const { serviceCenterName, accountHolderName, email, contact, bankDetailId, accountNumber, ifsc } = req.body;
    console.log("serviceCenterName", serviceCenterName);



    // Create new wallet data
    const walletData = new WalletModel(req.body);
    await walletData.save();
    res.json({ status: true, msg: "Wallet Added" });
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message); // Log detailed error
    res.status(400).send(err.response ? err.response.data : err.message);
  }
};


// router.post("/serviceCenterDuePayment",
const createTransaction = async (req, res) => {
  try {
    let body = req.body;
    // console.log(body);

    // Create and save the transaction record
    const transaction = new BankTransactionModel({
      // name:body.fund_account.bank_account.name,
      name: body.fund_account.bank_account.name,
      bankName: body.fund_account.bank_account.bankName,
      accountNo: body.fund_account.bank_account.account_number,
      ifscCode: body.fund_account.bank_account.ifsc,
      dealerId: body.fund_account.contact.reference_id,
      technicianId: body.fund_account.contact.reference_id,
      brandId: body.fund_account.contact.reference_id,
      serviceCenterId: body.fund_account.contact.reference_id,
      serviceCenterName: body.fund_account.contact.name,
      paidAmount: parseInt(body.amount, 10),  // Ensure amount is an integer
    });
    await transaction.save();

    // Send response after transaction is successfully saved


    // After sending the response, continue with additional operations
    const notification = new NotificationModel({
      serviceCenterId: body.fund_account.contact.reference_id,
      dealerId: body.fund_account.contact.reference_id,
      technicianId: body.fund_account.contact.reference_id,
      userId: body.fund_account.contact.reference_id,
      title: ' Payment',
      message: `Payment Processing, ${body.amount} INR!`,
    });
    await notification.save();

    // Update the wallet
    const serviceCenterWallet = await WalletModel.findOne({ serviceCenterId: body.fund_account.contact.reference_id }).exec();

    if (!serviceCenterWallet) {
      // Handle case where wallet is not found
      console.error('Wallet not found for service center:', body.fund_account.contact.reference_id);
      return;
    }

    serviceCenterWallet.totalCommission = (parseInt(serviceCenterWallet.totalCommission || 0) + parseInt(body.amount));
    serviceCenterWallet.dueAmount = (parseInt(serviceCenterWallet.dueAmount || 0) - parseInt(body.amount));
    await serviceCenterWallet.save();
    res.json({ status: true, msg: "Transaction created" });
  } catch (err) {
    console.error(err);
    res.status(400).send({ error: err.message });
  }
};

const updateTransactionStatus = async (req, res) => {
  try {
    const _id = req.params.id; // Extract ID from request parameters
    const body = req.body; // Extract request body
    // console.log(body);

    // Update wallet information by ID
    const updatedWallet = await BankTransactionModel.findByIdAndUpdate(_id, body, { new: true });

    if (updatedWallet) {
      // Create a notification
      const notification = new NotificationModel({
        // You might want to include dynamic IDs or user details in the notification
        title: 'Payment',
        message: 'Payment Successfuly   ',
        // Add the relevant user IDs if needed:
        // serviceCenterId: body.serviceCenterId,
        // dealerId: body.dealerId,
        // technicianId: body.technicianId,
        // userId: body.userId,
      });

      // Save the notification to the database
      await notification.save();

      // Send a success response
      return res.json({ status: true, msg: "Payment status updated successfully" });
    } else {
      // Send a failure response if no document was updated
      return res.json({ status: false, msg: "Payment status not updated" });
    }
  } catch (err) {
    // Log error and send an error response
    console.error('Error updating transaction status:', err);
    return res.status(500).json({ status: false, msg: 'Error updating payment status', error: err.message });
  }
};



// const updateTransaction = async (req, res) => {
//   try {
//     let _id = req.params.id;
//     let obj = await BankTransactionModel.findById(_id);
//     const payScreenshot = req.file.location;
//     // console.log("obj",obj);
//     // console.log("payScreenshot",payScreenshot);
//     if (!obj) {
//       return res.json({ status: false, msg: "Payment status not updated" });
//     }
//     let obj1 = await BankTransactionModel.findByIdAndUpdate(_id, { payScreenshot: payScreenshot, status: "SUCCESS" }, { new: true });

//     //  const updatedWallet = await BankTransactionModel.findByIdAndUpdate(_id, body, { new: true });

//     if (obj1) {
//       // Create a notification
//       const notification = new NotificationModel({
//         // You might want to include dynamic IDs or user details in the notification
//         title: 'Payment',
//         message: 'Payment Successfuly   ',
//         // Add the relevant user IDs if needed:
//         // serviceCenterId: body.serviceCenterId,
//         // dealerId: body.dealerId,
//         // technicianId: body.technicianId,
//         // userId: body.userId,
//       });

//       // Save the notification to the database
//       await notification.save();

//       // Send a success response
//       // res.json({ status: true, msg: "Update Transaction status", data: obj1 });
//       return res.json({ status: true, msg: "Payment status updated successfully", data: obj1 });
//     } else {
//       // Send a failure response if no document was updated
//       return res.json({ status: false, msg: "Payment status not updated" });
//     }

//   } catch (err) {
//     res.status(500).send(err);
//   }
// };
const updateTransaction = async (req, res) => {
  try {
    let _id = req.params.id;

    // console.log("Transaction ID:", _id);

    let obj = await BankTransactionModel.findById(_id);
    if (!obj) {
      return res.json({ status: false, msg: "Transaction not found" });
    }

    // Check if file is uploaded
    const payScreenshot = req.file?.location;
    if (!payScreenshot) {
      return res.status(400).json({ status: false, msg: "File upload failed" });
    }

    // console.log("Uploaded Screenshot URL:", payScreenshot);

    let obj1 = await BankTransactionModel.findByIdAndUpdate(
      _id,
      { payScreenshot: payScreenshot, status: "SUCCESS" },
      { new: true }
    );

    // console.log("Updated Transaction:", obj1);

    if (!obj1) {
      return res.json({ status: false, msg: "Payment status not updated" });
    }

    // Create and save notification
    const notification = new NotificationModel({
      title: "Payment",
      message: "Payment successfully updated",
    });

    await notification.save();

    return res.json({ status: true, msg: "Payment status updated successfully", data: obj1 });

  } catch (err) {
    console.error("Error in updateTransaction:", err);
    res.status(500).json({ status: false, msg: "Internal Server Error", error: err.message });
  }
};

const addWallet1 = async (req, res) => {
  try {
    const { serviceCenterName, accountHolderName, email, contact, bankDetailId, accountNumber, ifsc } = req.body;

    // Check if the service center name already exists
    const existingServiceCenter = await WalletModel.findOne({ serviceCenterName });
    if (existingServiceCenter) {
      return res.json({ status: false, msg: "Service Center already exists in Wallets" });
    }

    // Create new wallet data
    const walletData = new WalletModel(req.body);

    // Create contact data
    const contactData = {
      name: accountHolderName,
      email: email,
      contact: contact,
      type: "employee",
      reference_id: "Acme Contact ID 12345",
      notes: {
        random_key_1: "Make it so.",
        random_key_2: "Tea. Earl Grey. Hot."
      }
    };

    // Send request to create contact
    let response = await axios.post("https://api.razorpay.com/v1/contacts", contactData, {
      headers: {
        Authorization: "Basic " + Buffer.from(process.env.RAZORPAYX_KEY_ID + ":" + process.env.RAZORPAYX_KEY_SECRET).toString("base64")
      }
    });

    const { data: contactDataResponse } = response;
    // console.log("contacts data", contactDataResponse);

    // Check if contact creation was successful
    if (contactDataResponse && contactDataResponse.id) {
      // Create fund account data
      const fundData = {
        contact_id: contactDataResponse.id,
        account_type: "bank_account",
        bank_account: {
          name: accountHolderName,
          ifsc: ifsc,
          account_number: accountNumber,
        }
      };

      // Send request to create fund account
      let response1 = await axios.post("https://api.razorpay.com/v1/fund_accounts", fundData, {
        headers: {
          Authorization: "Basic " + Buffer.from(process.env.RAZORPAYX_KEY_ID + ":" + process.env.RAZORPAYX_KEY_SECRET).toString("base64")
        }
      });

      const { data: fundAccountData } = response1;
      // console.log("fund_accounts data", fundAccountData);

      const walletDetails = await BankDetail.findById(bankDetailId);
      console.log("walletDetails data", walletDetails);

      if (!walletDetails) {
        return res.status(404).json({ status: false, msg: 'Bank Detail not found' });
      }

      walletDetails.fund_account_id = fundAccountData.id;
      await walletDetails.save();
    }

    await walletData.save();
    res.json({ status: true, msg: "Wallet Added" });
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message); // Log detailed error
    res.status(400).send(err.response ? err.response.data : err.message);
  }
};

const getAllWallet = async (req, res) => {
  try {
    let data = await WalletModel.find({}).sort({ _id: -1 });
    res.send(data);
  } catch (err) {
    res.status(400).send(err);
  }
}
const getWalletById = async (req, res) => {
  try {
    let _id = req.params.id;
    let data = await WalletModel.findById(_id);
    res.send(data);
  } catch (err) {
    res.status(400).send(err);
  }
}
const getWalletByCenterId = async (req, res) => {
  try {
    let serviceCenterId = req.params.id;
    let data = await WalletModel.findOne({ serviceCenterId: serviceCenterId });
    if (!data) {
      return res.status(404).send({ message: "Wallet not found" });
    }
    res.send(data);
  } catch (err) {
    res.status(400).send(err);
  }
}
const getTransactionByCenterId = async (req, res) => {
  try {
    let serviceCenterId = req.params.id;
    let data = await BankTransactionModel.find({ serviceCenterId: serviceCenterId }).sort({ _id: -1 });
    if (!data) {
      return res.status(404).send({ message: "Transaction not found" });
    }
    res.send(data);
  } catch (err) {
    res.status(400).send(err);
  }
}
// const getTransactionByBrandId = async (req, res) => {
//   try {
//     let userId = req.params.id;
//     let data = await BankTransactionModel.find({ serviceCenterId: userId }).sort({ _id: -1 });
//     if (!data) {
//       return res.status(404).send({ message: "Transaction not found" });
//     }
//     res.send(data);
//   } catch (err) {
//     res.status(400).send(err);
//   }
// }
const getTransactionByBrandId = async (req, res) => {
  try {
    let brandId = req.params.id;

    // Find all service centers that belong to the given brandId
    let serviceCenters = await ServiceModel.find({ brandId }).select('_id');

    // Extract only the IDs
    let serviceCenterIds = serviceCenters.map(sc => sc._id);

    if (serviceCenterIds.length === 0) {
      return res.status(404).send({ message: "No service centers found for this brand" });
    }

    // Find transactions where serviceCenterId is in the list of retrieved IDs
    let transactions = await BankTransactionModel.find({ serviceCenterId: { $in: serviceCenterIds } }).sort({ _id: -1 });

    if (!transactions || transactions.length === 0) {
      return res.status(404).send({ message: "No transactions found for this brand" });
    }

    res.send(transactions);
  } catch (err) {
    res.status(500).send({ message: "Internal Server Error", error: err.message });
  }
};

const getAllTransaction = async (req, res) => {
  try {

    let data = await BankTransactionModel.find({}).sort({ _id: -1 });
    if (!data) {
      return res.status(404).send({ message: "Transaction not found" });
    }
    res.send(data);
  } catch (err) {
    res.status(400).send(err);
  }
}
const editWallet = async (req, res) => {
  try {
    let _id = req.params.id;
    let body = req.body;
    let data = await WalletModel.findByIdAndUpdate(_id, body);
    res.json({ status: true, msg: "Wallet Updated" });
  } catch (err) {
    res.status(500).send(err);
  }
}
const deleteWallet = async (req, res) => {
  try {
    let _id = req.params.id;
    let data = await WalletModel.findByIdAndDelete(_id);
    res.json({ status: true, msg: "Wallet Deteled" });
  } catch (err) {
    res.status(500).send(err);
  }
}

module.exports = { addWallet, createTransaction, updateTransaction, updateTransactionStatus, getTransactionByBrandId, getAllTransaction, getTransactionByCenterId, getAllWallet, getWalletById, getWalletByCenterId, editWallet, deleteWallet };
