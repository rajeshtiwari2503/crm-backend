const ChatTicketModel = require("../models/chatTicket")

const addChatTicket = async (req, res) => {

    try {
        let body = req.body;
        let data = new ChatTicketModel(body);
        await data.save();
        res.json({ status: true, msg: "Chat Ticket   Added" });
    } catch (err) {
        res.status(400).send(err);
    }

};

const sendMessageAdmin= async (req, res) => {
    try {
        const { userId, message } = req.body;
        if (!userId || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const timestamp = new Date();
        const chatTicket = await ChatTicketModel.findOneAndUpdate(
            { userId },
            { $push: { adminMessage: message } , $set: { updatedAt: timestamp }},
            { new: true, upsert: true }
        );

        res.json({ status: true, msg: 'Admin message added', chatTicket });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
const sendMessageUser= async (req, res) => {
    try {
        const { userId, sender, message } = req.body;
        if (!userId  || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const newMessage = { sender, message, timestamp: new Date() };
        const chatTicket = await ChatTicketModel.findOneAndUpdate(
            { userId },
            { $push: { messages: newMessage }, $set: { updatedAt: new Date() } },
            { new: true }
        );

        res.json({ status: true, msg: ' message added', chatTicket });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
const getAllChatTicket = async (req, res) => {
    try {
        let data = await ChatTicketModel.find({}).sort({ _id: -1 });
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}
const getChatTicketById = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await ChatTicketModel.findById(_id);
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}
const getChatTicketByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        const data = await ChatTicketModel.findOne({ userId: userId });
        
        if (!data) {
            return res.status(404).json({ message: 'Chat ticket not found' });
        }

        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
const editChatTicket = async (req, res) => {
    try {
        let _id = req.params.id;
        let body = req.body;
        let data = await ChatTicketModel.findByIdAndUpdate(_id, body);
        res.json({ status: true, msg: "ChatTicket Updated" });
    } catch (err) {
        res.status(500).send(err);
    }
}
const deleteChatTicket = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await ChatTicketModel.findByIdAndDelete(_id);
        res.json({ status: true, msg: "ChatTicket Deteled" });
    } catch (err) {
        res.status(500).send(err);
    }
}

module.exports = { addChatTicket,getChatTicketByUserId,sendMessageAdmin,sendMessageUser, getAllChatTicket, getChatTicketById, editChatTicket, deleteChatTicket };