const mongoose=require("mongoose")

const feedbackSchema=mongoose.Schema({
    ticketNumber: { type: String, required: true },
    customerName: { type: String, required: true },
    complaintId: { type: String },
    ticketNumber2: { type: String },
    emailAddress: { type: String },
    overallsatisfaction: { type: Number },
    servicequality: { type: Number,  },
    userId: { type: String,  },
    brandId: { type: String,  },
    brandName: { type: String,  },
    serviceCenter: { type: String,  },
    serviceCenterId: { type: String,  },
    technician : { type: String,  },
    technicianId : { type: String,  },
    replyMessage: { type: String,  },
    timeliness: { type: Number, required: true },
    professionalism: { type: Number, required: true },
    comments: { type: String, required: false },
    issuesFaced: { type: String, required: false },
    recommendationLikelihood: { type: Number, required: true },
    futureServiceInterest: { type: String   },
    serviceDate: { type: String   },
    status:{ type:String,default:"PENDING"}
  },{timestamps:true})
  
  const FeedbackModal=new mongoose.model("Feedback",feedbackSchema);
  
  module.exports=FeedbackModal;