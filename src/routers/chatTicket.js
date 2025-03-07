const express=require("express");
const router=express.Router();
 
 const { addChatTicket,sendMessageAdmin,getChatTicketByUserId,sendMessageUser,getAllChatTicket,getChatTicketById,editChatTicket,deleteChatTicket}=require("../controllers/chatTicketController")

router.post("/addChatTicket",addChatTicket );
router.post("/sendMessage",sendMessageUser );
router.post("/sendMessage/admin",sendMessageAdmin );
router.get("/getAllChatTicket",getAllChatTicket );
router.get("/getChatTicketByUserId/:userId",getChatTicketByUserId );
router.get("/getChatTicket/:id",getChatTicketById );
router.patch("/editChatTicket/:id",editChatTicket );
router.delete("/deleteChatTicket/:id",deleteChatTicket );

module.exports=router;