// services/smsTemplates.js

module.exports = {
   COMPLAINT_REGISTERED: {
    id: '1207167611795178628', // Replace with your actual DLT Template ID
    buildVars: ({ fullName, complaintId, issueType, serviceCenterName, visitTime, phoneNumber, otp, helpline }) => [
      fullName,              // {#var#} - Customer Name
      complaintId,           // {#var#} - Complaint Number
      issueType, 
      serviceCenterName,            // {#var#} - Complaint Description
      visitTime,             // {#var#} - Visit Time
      phoneNumber,    // {#var#} - Mobile
      otp,                   // {#var#} - OTP
      complaintId,           // {#var#} - Complaint Number (again)
      helpline               // {#var#} - Helpline
    ]
  },

  COMPLAINT_ASSIGNED: {
    id: '1207162912345678902',
    description: 'Complaint Assigned',
    buildVars: ({ technicianName, complaintNumber, customerName }) => [
      technicianName,
      complaintNumber,
      customerName
    ]
  },

  FEEDBACK_REQUEST: {
    id: '1207162912345678903',
    description: 'Feedback Request',
    buildVars: ({ customerName, complaintNumber, feedbackLink }) => [
      customerName,
      complaintNumber,
      feedbackLink
    ]
  }
};
