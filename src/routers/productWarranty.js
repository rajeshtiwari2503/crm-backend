

const express=require("express");
const router=express.Router();
 
const {addProductWarranty,activateWarranty,getAllActivationWarrantyWithPage,getActivationWarrantySearch,getAllProductWarranty,getAllProductWarrantyByBrandStickers,editActivationWarranty,getActivationWarrantyByUserId,getAllProductWarrantyWithPage, getAllProductWarrantyByIdWithPage,getAllProductWarrantyByBrandIdTotal,getAllProductWarrantyById,getActivationWarrantyById,getAllActivationWarranty,getProductWarrantyByUniqueId,getProductWarrantyById,editProductWarranty,deleteProductWarranty }=require("../controllers/productWarrantyController")

router.post("/addProductWarranty",addProductWarranty );
router.post("/activateWarranty",activateWarranty );
router.get("/getAllProductWarranty",getAllProductWarranty );
router.get("/getAllProductWarrantyByBrandStickers", getAllProductWarrantyByBrandStickers);
router.get("/getAllProductWarrantyWithPage",getAllProductWarrantyWithPage );
router.get("/getAllProductWarrantyByIdWithPage/:id",getAllProductWarrantyByIdWithPage );
router.get("/getAllProductWarrantyById/:id",getAllProductWarrantyById );
router.get("/getAllProductWarrantyByBrandIdTotal/:id",getAllProductWarrantyByBrandIdTotal );
router.get("/getAllActivationWarranty",getAllActivationWarranty );
router.get("/getAllActivationWarrantyWithPage",getAllActivationWarrantyWithPage );
router.get("/getActivationWarrantySearch",getActivationWarrantySearch );
router.get("/getActivationWarrantyById/:id",getActivationWarrantyById );
router.get("/getActivationWarrantyByUserId/:id",getActivationWarrantyByUserId );
router.get("/getProductWarranty/:id",getProductWarrantyById );
router.get("/getProductWarrantyByUniqueId/:id",getProductWarrantyByUniqueId );
router.patch("/editProductWarranty/:id",editProductWarranty );
router.patch("/editActivationWarranty/",editActivationWarranty );
router.patch("/deleteProductWarranty/:id",deleteProductWarranty );
module.exports=router;