const mongoose=require("mongoose");

const messageSchema = new mongoose.Schema({
    sender: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});

const chatTicketSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    messages: [messageSchema]
}, { timestamps: true });

const ChatTicketModel = new mongoose.model("chatTicket",chatTicketSchema);

module.exports=ChatTicketModel; 