const express = require("express")
const {upload}  = require("../services/service");
const {addOrder,addCenterOrder,approvalServiceOrder,addDefectiveOrder, getAllOrder,getAllOrderById, getOrderById, editOrder, deleteOrder}=require("../controllers/orderController")

const router=express.Router()

// router.post("/addOrder",addOrder)
router.post("/addOrder", upload().single("chalanImage"),addOrder );
router.post("/addCenterOrder", upload().single("chalanImage"),addCenterOrder );
router.patch("/approvalServiceOrder",approvalServiceOrder)
router.post("/addDefectiveOrder",addDefectiveOrder)
router.get("/getAllOrder",getAllOrder)
router.get("/getAllOrderById",getAllOrderById)
router.get("/getOrderById/:id",getOrderById)
router.patch("/editOrder/:id",editOrder)
router.delete("/deleteOrder/:id",deleteOrder)

module.exports=router