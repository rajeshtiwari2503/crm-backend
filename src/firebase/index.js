const admin = require("firebase-admin");  // Use "admin" instead of "firebase"

const serviceAccount = require("./service-acount-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = { admin };  // Export "admin", not "firebase"