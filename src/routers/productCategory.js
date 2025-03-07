const express=require("express");
const router=express.Router();
 
const {addProductCategory,getAllProductCategory,getProductCategoryById,editProductCategory,deleteProductCategory }=require("../controllers/productCategoryController")

router.post("/addProductCategory",addProductCategory );
router.get("/getAllProductCategory",getAllProductCategory );
router.get("/getProductCategory/:id",getProductCategoryById );
router.patch("/editProductCategory/:id",editProductCategory );
router.delete("/deleteProductCategory/:id",deleteProductCategory );
module.exports=router;