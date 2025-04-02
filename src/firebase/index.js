const admin = require("firebase-admin");  // Use "admin" instead of "firebase"

// const serviceAccount = require("./service-acount-key.json");
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = { admin };  // Export "admin", not "firebase"