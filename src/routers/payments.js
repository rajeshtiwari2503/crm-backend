
const express = require("express");
const router = new express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");

const NotificationModel = require("../models/notification")
const { UserModel,BrandRegistrationModel } = require("../models/registration")
const ComplaintModal = require("../models/complaint")
const BankTransactionModel = require("../models/bankTransaction");
const  BrandRechargeModel = require("../models/brandRecharge")
const WalletModel = require("../models/wallet")

const fs = require("fs");
const { default: axios } = require("axios");
require("dotenv");
const instance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
//const instance = new Razorpay({ key_id: "rzp_live_aOxuRwOwtnZ9v0", key_secret: "Obz13GEJNLLX3Fch2ziVGiA0" });


router.post("/payment", async (req, res) => {
  try {
    const order = await instance.orders.create({
      amount: (+req.body.amount) * 100,
      currency: "INR",
    });
    res.send(order);
  } catch (err) {
    res.status(400).send(err);
  }
});
router.post("/walletPayment", async (req, res) => {
  try {
    const pay = await instance.orders.create({
      amount: (+req.body.amount) * 100,
      currency: "INR",
    });
    res.send(pay);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.post("/paymentVerificationForUser", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body.response;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body.toString()).digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;


  if (isAuthentic) {
    try {
      let user = await UserModel.findById(req.body.row.userId);

      const notification = new NotificationModel({
        userId: user._id,
        userName: user.name,
        title: `User Payment`,
        message: `Payment Successfully  , ${req.body.amount} INR!`,
      });
      await notification.save();
      let transaction = new BankTransactionModel({ userId: user?._id, userName: user?.name, paidAmount: req.body.amount });
      await transaction.save();
      const complaint = await ComplaintModal.findById(req.body.row._id);
      if (!complaint) {
        return res.status(404).json({ status: false, msg: 'Complaint not found' });
      }

      complaint.payment = req.body.amount;
      await complaint.save();
      res.json({ status: true, msg: "Payment Successfull" });
    } catch (err) {
      res.status(400).send(err);
    }
  } else {
    res.status(401).send("Not Authorized");
  }
});
router.post("/paymentVerificationForBrand", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body.response;
  // console.log(req.body.response,"req.body");
  

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body.toString()).digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

// console.log(isAuthentic);

  if (isAuthentic) {
    try {
      let brand = await BrandRegistrationModel.findById(req.body.userD);
// console.log(brand);

      const notification = new NotificationModel({
        brandId: brand._id,
        userName: brand.brandName,
        title: `Brand Payment`,
        message: `Payment Successfully  , ${req.body.amount} INR!`,
      });
      await notification.save();
    
      let recharge = new BrandRechargeModel({ brandId: brand?._id, brandName: brand?.brandName, amount: req.body.amount ,description:"Recharge Added"});
      await recharge.save();
       
      res.json({ status: true, msg: "Payment Successfull" });
    } catch (err) {
      res.status(400).send(err);
    }
  } else {
    res.status(401).send("Not Authorized");
  }
});

router.get("/getAllWalletTransaction", async (req, res) => {
  try {

    let data = await BankTransactionModel.find({}).sort({ _id: -1 });
    res.send(data);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get("/getWalletTransaction/:id", async (req, res) => {
  try {
    let id = req.params.id;
    let data = await BankTransactionModel.find({ userId: id });
    res.send(data);
  } catch (err) {
    res.status(500).send(err);
  }
});


// router.post("/serviceCenterDuePayment",async(req,res)=>{
//       try{
//       let body=req.body;
//       console.log(body);

//       let response = await axios.post("https://api.razorpay.com/v1/payouts",body,{headers:{Authorization:"Basic " +new Buffer.from(process.env.RAZORPAYX_KEY_ID + ":" +process.env.RAZORPAYX_KEY_SECRET ).toString("base64")}});
//       let {data}=response;
//       console.log(data);
//       if (data?.entity === "payout") {
//         const notification = new NotificationModel({
//           serviceCenterId: data?._id,

//           title: `Service Center  Payment`,
//           message: `Payment Successfull, ${req.body.amount} INR!`,
//        });
//        await notification.save();
//        let transaction=new BankTransactionModel({serviceCenterId:user?._id,serviceCenterName:user?.name,paidAmount:req.body.amount});
//        await transaction.save();
//       }
//       res.send(data);
//       }catch(err){
//        res.status(400).send(err); 
//       }
// });



router.post("/serviceCenterDuePayment11111", async (req, res) => {
  try {
    let body = req.body;
    // console.log(body);

    let response = await axios.post(
      "https://api.razorpay.com/v1/payouts",
      body,
      {
        headers: {
          Authorization: "Basic " + Buffer.from(process.env.RAZORPAYX_KEY_ID + ":" + process.env.RAZORPAYX_KEY_SECRET).toString("base64"),
          'Content-Type': 'application/json'
        }
      }
    );
    let { data } = response;
    // console.log(data);

    if (data.entity === "payout") {
      const notification = new NotificationModel({
        serviceCenterId: body.fund_account.contact.reference_id,
        title: `Service Center Payment`,
        message: `Payment Successful, ${body.amount} INR!`,
      });
      await notification.save();
    const cerviceCenterWallet = await WalletModel.findOne({ serviceCenterId: body.fund_account.contact.reference_id }).exec();

    cerviceCenterWallet.totalCommission = parseInt(cerviceCenterWallet.totalCommission || 0) + (body.amount  );
    cerviceCenterWallet.dueAmount = parseInt(cerviceCenterWallet.dueAmount || 0) - (body.amount  );
    await cerviceCenterWallet.save();

    const transaction = new BankTransactionModel({
      serviceCenterId: body.fund_account.contact.reference_id,
      serviceCenterName: body.fund_account.contact.name,
      paidAmount: body.amount,
    });
    await transaction.save();
    }

    res.send(data);
  } catch (err) {
    console.error(err);
    res.status(400).send(err.response ? err.response.data : err);
  }
});

module.exports = router;