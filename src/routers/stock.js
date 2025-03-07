const express = require("express")

const {addStock,getAllUserStock,getStockByCenterId,getAllBrandStock,getStockById,editStock,deleteStock}=require("../controllers/stockController")

const router=express.Router()

router.post("/addStock",addStock)
router.get("/getAllStock",getAllBrandStock)
router.get("/getAllUserStock",getAllUserStock)
router.get("/getStockById/:id",getStockById)
router.get("/getStockByCenterId/:id",getStockByCenterId)
router.patch("/editStock/:id",editStock)
router.delete("/deleteStock/:id",deleteStock)

module.exports=router;