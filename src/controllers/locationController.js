const LocationModel = require("../models/location")

const addLocation = async (req, res) => {

    try {
        let body = req.body;
        let data = new LocationModel(body);
        await data.save();
        res.json({ status: true, msg: "Location   Added" });
    } catch (err) {
        res.status(400).send(err);
    }

};

const getAllLocation = async (req, res) => {
    try {
        let data = await LocationModel.find({}).sort({ _id: -1 });
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}
const getLocationById = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await LocationModel.findById(_id);
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}

const editLocation = async (req, res) => {
    try {
        let _id = req.params.id;
        let body = req.body;
        let data = await LocationModel.findByIdAndUpdate(_id, body);
        res.json({ status: true, msg: "Location Updated" });
    } catch (err) {
        res.status(500).send(err);
    }
}
const deleteLocation = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await LocationModel.findByIdAndDelete(_id);
        res.json({ status: true, msg: "Location Deteled" });
    } catch (err) {
        res.status(500).send(err);
    }
}

module.exports = { addLocation, getAllLocation, getLocationById, editLocation, deleteLocation };
