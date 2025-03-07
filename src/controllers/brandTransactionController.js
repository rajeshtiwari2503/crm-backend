const  BrandTransactionModel = require("../models/brandTransaction")

const addBrandTransaction = async (req, res) => {

    try {
        let body = req.body;
        let data = new BrandTransactionModel(body);
        await data.save();
        res.json({ status: true, msg: "BrandTransaction   Added" });
    } catch (err) {
        res.status(400).send(err);
    }

};

const getAllBrandTransaction = async (req, res) => {
    try {
        let data = await BrandTransactionModel.find({}).sort({ _id: -1 });
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}
const getBrandTransactionById = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await BrandTransactionModel.findById(_id);
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}

const editBrandTransaction = async (req, res) => {
    try {
        let _id = req.params.id;
        let body = req.body;
        let data = await BrandTransactionModel.findByIdAndUpdate(_id, body);
        res.json({ status: true, msg: "BrandTransaction Updated" });
    } catch (err) {
        res.status(500).send(err);
    }
}
const deleteBrandTransaction = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await BrandTransactionModel.findByIdAndDelete(_id);
        res.json({ status: true, msg: "BrandTransaction Deteled" });
    } catch (err) {
        res.status(500).send(err);
    }
}

module.exports = { addBrandTransaction, getAllBrandTransaction, getBrandTransactionById, editBrandTransaction, deleteBrandTransaction };
