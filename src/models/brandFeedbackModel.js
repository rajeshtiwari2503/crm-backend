const mongoose=require("mongoose")
   

const brandFeedbackSchema = new mongoose.Schema({
  brandName: String,
  brandId: String,
  contactPerson: String,
  designation: String,
  phone: String,
  email: String,

  serviceRatings: {
    installation: Number,
    repair: Number,
    sparePartHandling: Number,
    reverseLogistics: Number,
    technicalSupport: Number,
  },

  timeliness: { type: String, enum: ["Always", "Sometimes", "Rarely", "Never"] },
  customerSatisfaction: { type: String, enum: ["Yes", "No", "Sometimes"] },

  majorIssues: String,
  unresolvedEscalations: String,
  improvementSuggestions: String,
  additionalComments: String,

  authorizedPersonName: String,
  signature: String, // (optional, if uploading image use Buffer or URL)
  date: String,
});

const BrandFeedback=new mongoose.model("BrandFeedback",brandFeedbackSchema);
 module.exports=BrandFeedback;
 
