const express = require("express")
const SparePartModal =require("../models/sparePart")
const {addSparePart,getAllSparePart,getSparePartById,editSparePart,deleteSparePart}=require("../controllers/sparePartController")

const router=express.Router()

// router.post("/addSparepart",addSparePart)
router.get("/getAllSparepart",getAllSparePart)
router.get("/getSparepartById/:id",getSparePartById)
router.patch("/editSparepart/:id",editSparePart)
router.delete("/deleteSparepart/:id",deleteSparePart)

const { upload} = require("../services/service");

router.post('/addSparepart', upload().array('images'), async (req, res) => {
    try {
      let body = req.body;
      let files = req.files;
      let images = files.map(file => file.location);
      let obj = new SparePartModal({ ...body, images });
      let data = await obj.save();
      res.json({ status: true, msg: "Spare part added successfully", data });
    } catch (err) {
      res.status(400).send(err);
    }
  });
  router.patch("/uploadSPImage/:id", upload().single("image"), async (req, res) => {
    try {
        let _id = req.params.id;
        let obj = await SparePartModal.findById(_id);
        obj.images = [req.file.location];
        
        let obj1 = await SparePartModal.findByIdAndUpdate(_id, { images: obj.images }, { new: true });
        res.json({ status: true, msg: "Uploaded", data: obj1 });
    } catch (err) {
        res.status(500).send(err);
    }
});

module.exports=router