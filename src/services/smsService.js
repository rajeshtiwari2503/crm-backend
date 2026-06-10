 const axios = require('axios');
const qs = require('querystring');

/**
 * Send DLT-compliant SMS using BlessSMS
 * @param {string} to - Recipient mobile number (with or without 91)
 * @param {string} templateId - DLT template ID
 * @param {object} vars - Object containing variables for template
 * @returns {Promise<object>} API response
 */
async function sendBlessTemplateSms(to, templateId, vars) {
  // Ensure mobile number has country code
  const mobile = to.startsWith('91') ? to : `91${to}`;
console.log("Vars being sent:", vars);
  // ✅ Clean variables to remove extra spaces
 const cleanVars = vars.map(v => String(v).replace(/\s+/g, ' ').trim());
  // DLT-approved template (exact, placeholders {#var#})
  const templateText = `Dear {#var#}, Your complain #{#var#} regarding {#var#} has been registered with us. Please visit {#var#} at {#var#} Mobile : {#var#} If you are satisfied with his work, you can provide him/her OTP : {#var#} on Completion. Your Complain Number is {#var#}.@Lybley For any assistance give us a call on - {#var#}`;

  // ✅ Print for debugging (console will show placeholders, actual SMS replaces them)
  console.log("\n📨 Template for Debugging (placeholders remain):\n", templateText);
  console.log("📨 Variables to be sent:\n", cleanVars, "\n");
let filledText = templateText;
  vars.forEach(value => {
    filledText = filledText.replace('{#var#}', value);
  });

  // ✅ Print final message to verify
  console.log('\n📨 Final message being sent:\n', filledText, '\n');

  // Prepare API params
  const params = {
    user: 'Lybley@gmail.com',
    password: 'Lay@5875',
    senderid: 'LYBLEY',
    number: mobile,
    text: filledText,          // DLT template as-is
    VAR: cleanVars.join('|'),    // Variables array
    DLTTemplateId: templateId,
    PEID: '1201160327926710602',
    channel: 'Trans',
    route: '10',
    DCS: '0',
    flashsms: '0'
  };

  const queryString = qs.stringify(params);
  const url = `http://login.blesssms.com/api/mt/SendSMS?${queryString}`;

  try {
    const response = await axios.get(url);
    console.log('✅ SMS sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error sending SMS:', error.message);
    throw error;
  }
}

module.exports = { sendBlessTemplateSms };