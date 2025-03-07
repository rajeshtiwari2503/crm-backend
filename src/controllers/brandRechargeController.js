const  BrandRechargeModel = require("../models/brandRecharge")

const addRecharge = async (req, res) => {

    try {
        let body = req.body;
        let data = new BrandRechargeModel(body);
        await data.save();
        res.json({ status: true, msg: "Recharge   Added" });
    } catch (err) {
        res.status(400).send(err);
    }

};
const addRechargeByBrand = async (req, res) => {

    try {
        let body = req.body;
        
        // Check if file is uploaded
        let paymentImage = req.file ? req.file?.location : null;
    
        let data = new BrandRechargeModel({
          amount: body.amount,
          brandName: body.brandName,
          brandId: body.brandId,
          description: body.description,
          paymentImage, // Store image path in DB
        });
    
        await data.save();
        res.json({ status: true, msg: "Recharge Added", data });
      } catch (err) {
        res.status(400).send(err);
      }

};
const getAllRecharge = async (req, res) => {
    try {
        let data = await BrandRechargeModel.find({}).sort({ _id: -1 });
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}
// const getRechargeById = async (req, res) => {
//     try {
//         let _id = req.params.id;
//         let data = await BrandRechargeModel.findById(_id);
//         res.send(data);
//     } catch (err) {
//         res.status(400).send(err);
//     }
// }
const getRechargeById = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await BrandRechargeModel.findById(_id);

        if (!data) {
            // If no data is found, send a custom response
            return res.status(401).send({
                message: "No recharge data found",
                amount: 0,
            });
        }

        res.send(data);
    } catch (err) {
        res.status(400).send({
            message: "An error occurred while fetching recharge data",
            error: err.message,
        });
    }
};


const editRecharge = async (req, res) => {
    try {
        let _id = req.params.id;
        let body = req.body;
        let data = await BrandRechargeModel.findByIdAndUpdate(_id, body);
        res.json({ status: true, msg: "Recharge Updated" });
    } catch (err) {
        res.status(500).send(err);
    }
}
const deleteRecharge = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await BrandRechargeModel.findByIdAndDelete(_id);
        res.json({ status: true, msg: "Recharge Deteled" });
    } catch (err) {
        res.status(500).send(err);
    }
}

module.exports = { addRecharge,addRechargeByBrand, getAllRecharge, getRechargeById, editRecharge, deleteRecharge };
