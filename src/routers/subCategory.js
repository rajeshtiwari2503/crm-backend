const express = require("express")

const {addSubCategory,getAllSubCategory,getSubCategoryById,getSubCategoryByCateId,editSubCategory,deleteSubCategory}=require("../controllers/subCategoryController")

const router=express.Router()

router.post("/addSubCategory",addSubCategory)
router.get("/getAllSubCategory",getAllSubCategory)
router.get("/getSubCategoryById/:id",getSubCategoryById)
router.get("/getSubCategoryByCateId/:id",getSubCategoryByCateId)
// router.get("/getSubCategoryByCenterId/:id",getComplaintByCenterId)
router.patch("/editSubCategory/:id",editSubCategory)
router.delete("/deleteSubCategory/:id",deleteSubCategory)

module.exports=router