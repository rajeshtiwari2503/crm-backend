 const nodemailer = require("nodemailer");
require("dotenv").config();
// console.log("process.env.EMAIL_USER",process.env.EMAIL_USER);
// console.log("process.env.EMAIL_PASS",process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
  service: "gmail", // or configure SMTP
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendReportEmail(to, filePath) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Daily Pending Complaints Report",
    text: "Please find attached the daily pending complaints report.",
    attachments: [
      {
        filename: "PendingComplaints.xlsx",
        path: filePath,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { transporter, sendReportEmail };
