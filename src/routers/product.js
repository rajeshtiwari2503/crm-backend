const express=require("express");
const router=express.Router();
 
 const { addProduct,getAllProduct,getProductById,editProduct,deleteProduct}=require("../controllers/productController")

router.post("/addProduct",addProduct );
router.get("/getAllProduct",getAllProduct );
router.get("/getProduct/:id",getProductById );
router.patch("/editProduct/:id",editProduct );
router.delete("/deleteProduct/:id",deleteProduct );

module.exports=router;