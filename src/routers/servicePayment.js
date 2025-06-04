const express=require("express");
const router=express.Router();
const {upload}  = require("../services/service");
const ServicePaymentModel = require("../models/servicePaymentModel")
const { ServiceModel } = require('../models/registration');
const ComplaintModal = require("../models/complaint");

 const { addServicePayment,getAllServicePayment,getAllServicePaymentByCenterId,getServicePaymentById,updateBulkPayments,editServicePayment,deleteServicePayment}=require("../controllers/servicePaymentController")

// router.post("/addServicePayment",addServicePayment );
router.post("/addServicePayment", upload().single("qrCode"),addServicePayment );
router.get("/getAllServicePayment",getAllServicePayment );
router.get("/getAllServicePaymentByCenterId/:id",getAllServicePaymentByCenterId );
router.get("/getServicePayment/:id",getServicePaymentById );
// router.patch("/editServicePayment/:id",editServicePayment );
router.patch("/editServicePayment/:id", upload().single("payScreenshot"),editServicePayment );
router.delete("/deleteServicePayment/:id",deleteServicePayment );

router.put('/updateBulkPayments',updateBulkPayments);


const mongoose = require("mongoose");

router.get('/wallet-payment-summary', async (req, res) => {
  try {
    const { month, year, sortBy } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and Year are required" });
    }

    const start = new Date(`${year}-${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    // Wallet Payments Summary
    const payments = await ServicePaymentModel.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lt: end }
        }
      },
      {
        $addFields: {
          serviceCenterObjectId: {
            $convert: {
              input: "$serviceCenterId",
              to: "objectId",
              onError: null,
              onNull: null
            }
          }
        }
      },
      {
        $match: {
          serviceCenterObjectId: { $ne: null }
        }
      },
      {
        $lookup: {
          from: "servicecenters",
          localField: "serviceCenterObjectId",
          foreignField: "_id",
          as: "serviceCenter"
        }
      },
      { $unwind: "$serviceCenter" },
      {
        $group: {
          _id: "$serviceCenter._id",
          name: { $first: "$serviceCenter.name" },
          type: { $first: "$serviceCenter.serviceCenterType" },
          totalAmount: {
            $sum: { $toDouble: "$payment" }
          },
          unpaidCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "UNPAID"] }, 1, 0]
            }
          }
        }
      },
      {
        $sort:
          sortBy === "high"
            ? { totalAmount: -1 }
            : sortBy === "low"
            ? { totalAmount: 1 }
            : { name: 1 }
      }
    ]);

    // Complaint TAT Summary
    const complaints = await ComplaintModal.find({
      createdAt: { $gte: start, $lt: end },
      closedAt: { $ne: null }
    }).lean();

    const tatBuckets = {
      "1-2": 0,
      "2-3": 0,
      "3-5": 0,
      ">5": 0
    };

    complaints.forEach(comp => {
      const tatDays = Math.ceil((new Date(comp.closedAt) - new Date(comp.createdAt)) / (1000 * 60 * 60 * 24));
      if (tatDays <= 2) tatBuckets["1-2"]++;
      else if (tatDays <= 3) tatBuckets["2-3"]++;
      else if (tatDays <= 5) tatBuckets["3-5"]++;
      else tatBuckets[">5"]++;
    });

    console.log("Summary Payments:", payments);
    console.log("TAT Report:", tatBuckets);

    return res.json({
      summary: payments,
      tatReport: tatBuckets
    });

  } catch (err) {
    console.error("Error in /wallet-payment-summary:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});




module.exports=router;