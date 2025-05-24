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

async function sendBlessTemplateSms(to, templateId, smsVars) {
  const mobile = to.startsWith('91') ? to : `91${to}`;

  const params = {
    user: 'Lybley@gmail.com',
    password: 'Lay@5875',
    senderid: 'LYBLEY',
    number: mobile,
    message: smsVars.join('|'),
    type: '3',
    template_id: templateId,
    // route: '##',  // remove or fix this
    channel: 'Promo'
  };

  const queryString = qs.stringify(params);
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
