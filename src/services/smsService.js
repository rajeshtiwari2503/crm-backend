 

 


// const axios = require('axios');
// const qs = require('querystring');

// async function sendBlessTemplateSms(to, templateId, smsVars) {
//   const mobile = to.startsWith('91') ? to : `91${to}`;

//   // Replace with EXACT DLT-approved template body
//   const templateText = `Dear {#var#}, Your complain #{#var#} regarding {#var#} has been registered with us. Please visit {#var#} at {#var#} Mobile : {#var#} If you are satisfied with his work, you can provide him/her OTP : {#var#} on Completion. Your Complain Number is {#var#}.@Lybley For any assistance give us a call on - {#var#}`;

//   // Replace vars into template
//   let filledText = templateText;
//   smsVars.forEach(value => {
//     filledText = filledText.replace('{#var#}', value);
//   });

//   // ✅ Print final message to verify
//   console.log('\n📨 Final message being sent:\n', filledText, '\n');

//   const params = {
//     user: 'Lybley@gmail.com',
//     password: 'Lay@5875',
//     senderid: 'LYBLEY',
//     number: mobile,
//     text: filledText,
//     VAR: smsVars.join('|'),
//     DLTTemplateId: templateId,
//     PEID: '1201160327926710602',
//     channel: 'Trans',
//     route: '10',
//     DCS: '0',
//     flashsms: '0'
//   };

//   const queryString = qs.stringify(params);
//   const url = `http://login.blesssms.com/api/mt/SendSMS?${queryString}`;

//   try {
//     const response = await axios.get(url);
//     console.log('✅ SMS sent:', response.data);
//     return response.data;
//   } catch (error) {
//     console.error('❌ Error sending SMS:', error.message);
//     throw error;
//   }
// }

// module.exports = { sendBlessTemplateSms };



const axios = require('axios');
const qs = require('querystring');

async function sendBlessTemplateSms(to, templateId, smsVars) {
  const mobile = to.startsWith('91') ? to : `91${to}`;
// console.log("smsVars",smsVars);

  // Replace with EXACT DLT-approved template body
  // const templateText = `Dear {#var#}, Your complain #{#var#} regarding {#var#} has been registered with us. Service Center will visit your location at {#var#} Mobile : {#var#} If you are satisfied with his work, you can provide him/her OTP : {#var#} on Completion. Your Complain Number is {#var#}.@Lybley For any assistance give us a call on - {#var#}`;

  
       const templateText = `Dear {#var#}, Your complain #{#var#} regarding {#var#} has been registered with us. Please visit {#var#} at {#var#} Mobile : {#var#} If you are satisfied with his work, you can provide him/her OTP : {#var#} on Completion. Your Complain Number is {#var#}.@Lybley For any assistance give us a call on - {#var#}`;

  // Replace vars into template
  let filledText = templateText;
  smsVars.forEach(value => {
    filledText = filledText.replace('{#var#}', value);
  });

  // ✅ Print final message to verify
  // console.log('\n📨 Final message being sent:\n', filledText, '\n');

  const params = {
    user: 'Lybley@gmail.com',
    password: 'Lay@5875',
    senderid: 'LYBLEY',
    number: mobile,
    text: filledText,
    VAR: smsVars.join('|'),
    DLTTemplateId: templateId,
    PEID: '1201160327926710602',
    channel: 'Trans',
    route: '10',
    DCS: '0',
    flashsms: '0'
  };
//  console.log("params",params);
  const queryString = qs.stringify(params);
  // console.log("queryString",queryString);
  
  const url = `http://login.blesssms.com/api/mt/SendSMS?${queryString}`;

  try {
    const response = await axios.get(url);
    // console.log('✅ SMS sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error sending SMS:', error.message);
    throw error;
  }
}

module.exports = { sendBlessTemplateSms };
