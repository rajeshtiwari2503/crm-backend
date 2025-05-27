 //  // smsService.js
// const axios = require('axios');
// require('dotenv').config();

// async function sendBlessTemplateSms(to, templateId, smsVars) {
//     const mobile = to.startsWith('91') ? to : `91${to}`;
//   const params = {
//     user: process.env.BLESS_SMS_USER,
//     password: process.env.BLESS_SMS_PASS,
//     sender: process.env.BLESS_SMS_SENDER,
//     mobile: mobile,
//     message: smsVars.join('|'),
//     type: '3',
//     template_id: templateId
//   };
// console.log("params",params);

//   const url = 'https://login.blesssms.com/api/mt/SendSMS';

//   try {
//     const response = await axios.get(url, { params });
//     console.log('SMS sent:', response.data);
//     return response.data;
//   } catch (error) {
//     console.error('SMS error:', error.message);
//     throw error;
//   }
// }

// module.exports = {
//   sendBlessTemplateSms
// };

 const axios = require('axios');
const qs = require('querystring');
 require('dotenv').config();

async function sendBlessTemplateSms(to, templateId, smsVars) {
  const mobile = to.startsWith('91') ? to : `91${to}`;
 
  const templateText = `Dear {#var#}, Your complain {#var#} regarding {#var#} has been registered with us. Please visit {#var#} at {#var#} Mobile : {#var#} If you are satisfied with his work, you can provide him/her OTP : {#var#} on Completion. Your Complain Number is {#var#}.@Lybley For any assistance give us a call on - {#var#}`;
console.log("smsVars",smsVars);
 
 

let filledText = templateText;

smsVars.forEach(value => {
  filledText = filledText.replace('{#var#}', value);
});

console.log(filledText);
  const params = {
      user: "Lybley@gmail.com",
    password: "Lay@5875",
    sender: "LYBLEY",
    number: mobile,
    text: filledText,
    VAR: smsVars.join('|'),          // 🔥 Required for filling {#var#}
    DLTTemplateId: templateId,
    PEID: '1201160327926710602',
    channel: 'Trans',
    route: '10',                       // Often '4' for transactional; check docs
    DCS: '0',
    flashsms: '0'
  };

  const queryString = qs.stringify(params);
  // console.log("queryString",queryString);
  
  const url = `http://login.blesssms.com/api/mt/SendSMS?${queryString}`;

  try {
    const response = await axios.post(url);
    console.log('SMS sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending SMS:', error.message);
    throw error;
  }
}

module.exports = { sendBlessTemplateSms };