const express = require("express")

const {addStock,requestCenterStock,getAllStockRequests,getStockRequestByStockId,getAllUserStock,getStockByCenterId,getAllBrandStock,getStockById,editStock,editServiceCenterStock,deleteStock}=require("../controllers/stockController")

const router=express.Router()

router.post("/addStock",addStock)
router.post("/requestCenterStock",requestCenterStock)
router.get("/getAllStock",getAllBrandStock)
router.get("/getAllUserStock",getAllUserStock)
router.get("/getAllStockRequests",getAllStockRequests)

router.get("/getStockById/:id",getStockById)
router.get("/getStockByCenterId/:id",getStockByCenterId)
router.get("/getStockRequestByStockId/:id",getStockRequestByStockId)
router.patch("/editStock/:id",editStock)
router.patch("/editServiceCenterStock/:id",editServiceCenterStock)
router.delete("/deleteStock/:id",deleteStock)

module.exports=router;