const mongoose=require("mongoose")

const notificationSchema=mongoose.Schema({
    complaintId: { type: String  },
    compId: { type: String  },
    userId: { type: String  },
    dealerId: { type: String  },
    brandId: { type: String,  },
    serviceCenterId: { type: String,  },
    technicianId : { type: String,  },
    userName: { type: String  },
    message: { type: String },
    title: { type: String },
    adminStatus:{ type:String,default:"UNREAD"},
    userStatus:{ type:String,default:"UNREAD"},
    technicianStatus:{ type:String,default:"UNREAD"},
    serviceCenterStatus:{ type:String,default:"UNREAD"},
    brandStatus:{ type:String,default:"UNREAD"},
    dealerStatus:{ type:String,default:"UNREAD"},
  },{timestamps:true})
  
  const NotificationModal=new mongoose.model("Notification",notificationSchema);
  
  module.exports=NotificationModal;