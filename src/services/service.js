// const fast2sms = require("fast-two-sms");
// const nodemailer = require("nodemailer");
const multer = require("multer");
const multers3 = require("multer-s3");
const aws = require("aws-sdk");
// const qr=require("qrcode");
require('dotenv').config();
// const {S3Client,PutObjectCommand,GetObjectCommand } = require("@aws-sdk/client-s3");

// async function smsSend(otp, mobile) {
//   try {
//     let options = {
//       authorization: "Ik2U0hmvgBQ9doVNpXTAfP8HJ3xuaFtyicwMqje1KD75EbC4S6gi3BjVoPRaEMKA9wdGyxc76FNYZ80S",
//       message: otp,
//       numbers: [mobile]
//     }
//     let sms = await fast2sms.sendMessage(options);
//     // console.log(sms)
//   } catch (err) {
//     console.log(err);
//   }
// }

// async function careerOrContactMail(name, contact, email, otp) {

//   let transporter = nodemailer.createTransport({
//     host: 'smtp.zoho.in',
//     port: 587,
//     secure: false,
//     requireTLS: true,
//     auth: {
//       user: "hi@sparetrade.in",
//       pass: "ST@lybley9"
//     }
//   });

//   // Email content
//   let mailOptions = {
//     from: `<${email}>`,
//     to: 'help@lybley.com',
//     subject: ' Your Email Verification OTP',
//     text: `
//       Name: ${name}
//       Contact: ${contact}
//       Email: ${email}
//       otp: ${otp}
//     `
//   };

//   try {
//     let info = await transporter.sendMail(mailOptions);
//   } catch (err) {
//     console.log("err", err);
//   }
// }



// async function sendMail(email, otp) {
//   let transporter = nodemailer.createTransport({
//     host: "smtp.zoho.in",
//     port: 587,
//     secure: false,
//     requireTLS: true,
//     auth: {
//       user: "hi@sparetrade.in",
//       pass: "ST@lybley9"
//     }
//   });

//   try {
//     let info = await transporter.sendMail({
//       from: '"Lybley" <hi@sparetrade.in>',
//       to: email,
//       subject: "Your Email Verification OTP",
//       html: `<h4>Email Verification</h4>
//                    <p>Thank you for registering with Lybley. Please use the following OTP to verify your email address:</p>
//                    <h2>${otp}</h2>
//                    <p>If you did not request this, please ignore this email.</p>`
//     });

//     console.log('Email sent: ' + info.response);
//   } catch (err) {
//     console.log('Error: ', err);
//   }
// }
// async function sendMail(email, pass, isForget) {
//   let transporter = nodemailer.createTransport({
//     host: "smtp.zoho.in",
//     port: 587,
//     secure: false,
//     requireTLS: true,
//     auth: {
//       // user:"jesus.mueller87@ethereal.email",
//       user: "hi@sparetrade.in",
//       pass: "ST@lybley9"
//       //pass:"zT95Aax114tCZtwD1B"
//     }
//   })

//   try {
//     let sub = isForget ? "SpareTrade Password changed" : "Lybley Verification";
//     let info = await transporter.sendMail({
//       from: '"SpareTrade  " <hi@sparetrade.in>',
//       to: email,
//       subject: sub,
//       html: `<h4>${isForget ? "Your Password has been changed." : "Thank you for your Verifictaion."}<h4>
//             ${isForget ? "You have successfully changed your password." : "You have successfully registered on LY3LEY."}
//            <P></P>
//           ${isForget ? "" : `Username:<a href="#">${email}</a> <br/>`}
//           ${isForget ? "New Password" : "Password"}:<a href="#">${pass}</a>`
//     });

//   } catch (err) {
//     console.log("err", err);
//   }
// }

// async function sendMail(email,pass,isForget){
//      let transporter = nodemailer.createTransport({
//         host:"smtp.zoho.in",
//         port:587,
//         secure:false,
//         requireTLS:true,
//         auth:{
//            // user:"jesus.mueller87@ethereal.email",
//             user:"hi@sparetrade.in",
//             pass:"wegveb-mygwep-6xowxA"
//             //pass:"zT95Aax114tCZtwD1B"
//         }
//      })

// try{
//     let sub=isForget ? "SpareTrade Password changed" : "SpareTrade Registration";
//      let info = await transporter.sendMail({
//         from:'"SpareTrade  " <hi@sparetrade.in>',
//         to:email,
//         subject:sub,
//         html:`<h4>${isForget ? "Your Password has been changed." : "Thank you for your registration."}<h4>
//                ${isForget ? "You have successfully changed your password." : "You have successfully registered on LY3LEY."}
//               <P></P>
//              ${isForget ? "" : `Username:<a href="#">${email}</a> <br/>`}
//              ${isForget ? "New Password" : "Password"}:<a href="#">${pass}</a>`
//      });

// }catch(err){
//     console.log("err",err);
// }
// }

const s3 = new aws.S3({
  region: process.env.AWS_BUCKET_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_V,
  secretAccessKey: process.env.AWS_SECRET_KEY_V
})

const upload = () => multer({
  storage: multers3({
    s3,
    bucket: "sparetrade-bucket",
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: async function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.originalname + '-' + uniqueSuffix);
    }
  })
})



// const QRCode = require('qrcode-generator');

// function generateQRCodeFromString(stringData) {
//   try {
//     const qr = QRCode(0, 'L'); // Create a QRCode instance
//     qr.addData(stringData); // Add the string data
//     qr.make();

//     const qrCodeData = qr.createDataURL(4); // Generate QR code data URL
//     return qrCodeData;
//   } catch (error) {
//     console.error('Error generating QR code:', error);
//     throw error;
//   }
// }

module.exports = {
  // smsSend,
  upload,
  // sendMail
}