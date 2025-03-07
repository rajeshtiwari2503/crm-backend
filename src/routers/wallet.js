const express = require("express")
const {upload}  = require("../services/service");

const {addWallet,createTransaction,updateTransaction,updateTransactionStatus,getAllWallet,getWalletById,getTransactionByBrandId,getAllTransaction,getTransactionByCenterId,getWalletByCenterId,editWallet,deleteWallet}=require("../controllers/walletController")

const router=express.Router()

router.post("/addWallet",addWallet)
router.post("/serviceCenterDuePayment",createTransaction)
router.patch("/updateTransaction/:id", upload().single("payScreenshot"),updateTransaction );
// router.patch("/updateTransaction/:id",updateTransactionStatus );
router.get("/getAllWallet",getAllWallet)
router.get("/getWalletById/:id",getWalletById)
router.get("/getWalletByCenterId/:id",getWalletByCenterId)
router.get("/getAllTransaction",getAllTransaction)
router.get("/getTransactionByBrandId/:id",getTransactionByBrandId)
router.get("/getTransactionByCenterId/:id",getTransactionByCenterId)
router.patch("/editWallet/:id",editWallet)
router.delete("/deleteWallet/:id",deleteWallet)

module.exports=router;