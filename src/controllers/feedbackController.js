 
const BrandFeedback = require("../models/brandFeedbackModel");
const FeedbackModel = require("../models/feedback")
const NotificationModel = require("../models/notification")

const addFeedback = async (req, res) => {

    try {
        let body = req.body;
        let data = new FeedbackModel(body);
        await data.save();
        const notification = new NotificationModel({
            complaintId: req.body.complaintId,
            userId: req.body.userId,
            technicianId: req.body.technicianId,
            serviceCenterId: req.body.serviceCenterId,
            brandId: req.body.brandId,
            userName: req.body.customerName,
            title: `User Feedback`,
            message: `Thank you for your feedback, ${req.body.customerName}!`,
        });
        await notification.save();
        res.json({ status: true, msg: "Thank you for your feedback" });
    } catch (err) {
        res.status(400).send(err);
    }

};

const getAllFeedback = async (req, res) => {
    try {
        let data = await FeedbackModel.find({}).sort({ _id: -1 });
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}
const getAllBrandFeedback = async (req, res) => {
    try {
        let data = await BrandFeedback.find({}).sort({ _id: -1 });
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}

const getFeedbackByUserId = async (req, res) => {
    try {
        let userId = req.params.id;
        let data = await FeedbackModel.find({ userId: userId }).sort({ _id: -1 });
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}

const getFeedbackByBrandId = async (req, res) => {
    try {
        let brandId = req.params.id;
        let data = await FeedbackModel.find({ brandId: brandId }).sort({ _id: -1 });
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}
const getFeedbackByTechnicianId = async (req, res) => {
    try {
        let technicianId = req.params.id;
        let data = await FeedbackModel.find({ technicianId: technicianId }).sort({ _id: -1 });
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}
const getFeedbackByServiceCenterId = async (req, res) => {
    try {
        let serviceCenterId = req.params.id;
        let data = await FeedbackModel.find({ serviceCenterId: serviceCenterId }).sort({ _id: -1 });
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}
const getFeedbackById = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await FeedbackModel.findById(_id);
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}

const editFeedback = async (req, res) => {
    try {
        let _id = req.params.id;
        let body = req.body;
        let data = await FeedbackModel.findByIdAndUpdate(_id, body);
        if (body.replyMessage) {
            const notification = new NotificationModel({
                complaintId: data.complaintId,
                userId: data.userId,
                technicianId: data.technicianId,
                serviceCenterId: data.serviceCenterId,
                brandId: data.brandId,
                userName: data.customerName,
                title: `Brand Feedback Reply`,
                message: `Thank you for your  Reply on Feedback !`,
            });
            await notification.save();
        }

        res.json({ status: true, msg: "Feedback Updated" });
    } catch (err) {
        res.status(500).send(err);
    }
}
const deleteFeedback = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await FeedbackModel.findByIdAndDelete(_id);
        res.json({ status: true, msg: "Feedback Deteled" });
    } catch (err) {
        res.status(500).send(err);
    }
}

module.exports = {
    addFeedback, getFeedbackByUserId,getAllBrandFeedback, getFeedbackByBrandId, getFeedbackByTechnicianId, getFeedbackByServiceCenterId
    , getAllFeedback, getFeedbackById, editFeedback, deleteFeedback
};
