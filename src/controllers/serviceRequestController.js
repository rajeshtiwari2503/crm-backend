const ServiceRequestModel = require("../models/serviceRequest")

const addServiceRequest = async (req, res) => {

    try {
        let body = req.body;
        let data = new ServiceRequestModel(body);
        await data.save();
        res.json({ status: true, msg: "ServiceRequest   Added" });
    } catch (err) {
        res.status(400).send(err);
    }

};

const getAllServiceRequest = async (req, res) => {
    try {
        let data = await ServiceRequestModel.find({}).sort({ _id: -1 });
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}
const getServiceRequestById = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await ServiceRequestModel.findById(_id);
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}

const editServiceRequest = async (req, res) => {
    try {
        let _id = req.params.id;
        let body = req.body;
        let data = await ServiceRequestModel.findByIdAndUpdate(_id, body);
        res.json({ status: true, msg: "ServiceRequest Updated" });
    } catch (err) {
        res.status(500).send(err);
    }
}
const deleteServiceRequest = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await ServiceRequestModel.findByIdAndDelete(_id);
        res.json({ status: true, msg: "ServiceRequest Deteled" });
    } catch (err) {
        res.status(500).send(err);
    }
}

module.exports = { addServiceRequest, getAllServiceRequest, getServiceRequestById, editServiceRequest, deleteServiceRequest };
