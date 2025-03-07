const NotificationModel = require("../models/notification")

const addNotification = async (req, res) => {

    try {
        let body = req.body;
        let data = new NotificationModel(body);
        await data.save();
        res.json({ status: true, msg: "Notification   Added" });
    } catch (err) {
        res.status(400).send(err);
    }

};

const getAllNotification = async (req, res) => {
    try {
        let data = await NotificationModel.find({}).sort({ _id: -1 });
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}


const getNotificationByBrandId = async (req, res) => {
    try {
        let brandId = req.params.id;  
        let data = await NotificationModel.find({ brandId: brandId }).sort({ _id: -1 });
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}

const getNotificationByUserId = async (req, res) => {
    try {
        let userId = req.params.id;  
        let data = await NotificationModel.find({ userId: userId }).sort({ _id: -1 });
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}

const getNotificationByTechnicianId = async (req, res) => {
    try {
        let technicianId = req.params.id;  
        let data = await NotificationModel.find({ technicianId: technicianId }).sort({ _id: -1 });
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}
const getNotificationByServiceCenterId = async (req, res) => {
    try {
        let serviceCenterId = req.params.id;  
        let data = await NotificationModel.find({ serviceCenterId: serviceCenterId }).sort({ _id: -1 });
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}
const getNotificationByDealerId = async (req, res) => {
    try {
        let dealerId = req.params.id;  
        let data = await NotificationModel.find({ dealerId: dealerId }).sort({ _id: -1 });
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}
 
 


const getNotificationById = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await NotificationModel.findById(_id);
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}

const editNotification = async (req, res) => {
    try {
        let _id = req.params.id;
        let body = req.body;
        let data = await NotificationModel.findByIdAndUpdate(_id, body);
        res.json({ status: true, msg: "Notification Updated" });
    } catch (err) {
        res.status(500).send(err);
    }
}
const deleteNotification = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await NotificationModel.findByIdAndDelete(_id);
        res.json({ status: true, msg: "Notification Deteled" });
    } catch (err) {
        res.status(500).send(err);
    }
}

module.exports = { addNotification,getNotificationByUserId,getNotificationByBrandId,getNotificationByServiceCenterId,getNotificationByTechnicianId,getNotificationByDealerId, getAllNotification, getNotificationById, editNotification, deleteNotification };
