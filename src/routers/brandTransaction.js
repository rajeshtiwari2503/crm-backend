const express=require("express");
const router=express.Router();
 
 const { addBrandTransaction,getAllBrandTransaction,getBrandTransactionById,editBrandTransaction,deleteBrandTransaction}=require("../controllers/brandTransactionController")

router.post("/addBrandTransaction",addBrandTransaction );
router.get("/getAllBrandTransaction",getAllBrandTransaction );
router.get("/getBrandTransaction/:id",getBrandTransactionById );
router.patch("/editBrandTransaction/:id",editBrandTransaction );
router.delete("/deleteBrandTransaction/:id",deleteBrandTransaction );

module.exports=router;