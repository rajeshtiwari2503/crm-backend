const express = require('express');
const { createConsignmentDTDC , validatePincodes, generateLabel,trackShipment, cancelConsignment } = require('../controllers/courierService');
const router = express.Router();
 

 

router.post('/create-dtdc-shipment', createConsignmentDTDC);
router.get('/dtdc/label', generateLabel); // ?reference_number=XXX
router.get('/dtdc/track/:awb_number', trackShipment);

router.post('/dtdc/cancel/:orderId', cancelConsignment);
router.post("/validate-pincode", validatePincodes);
 

module.exports = router;
