const express = require('express');
const router = express.Router();
const shipyariService = require('../controllers/orderByShipyariContaroller');

router.post('/shipping-rates', async (req, res) => {
  try {
    const data = req.body;
    const rates = await shipyariService.getShippingRates(data);
    res.json(rates);
  } catch (error) {
    res.status(500).send('Error fetching shipping rates');
  }
});

router.post('/create-shipment', shipyariService.createShipment);
router.post('/create-center-shipment', shipyariService.createServiceShipment);
router.post('/create-defective-shipment', shipyariService.createDefectiveShipment);
router.post("/fetchManifest",shipyariService.fetchManifest);
router.post("/fetchLabels",shipyariService.fetchLabels);
router.post("/cancelShipment",shipyariService.cancelShipment);
router.get("/trackingShipment",shipyariService.trackingShipment);
router.post("/searchAvailability",shipyariService.searchAvailability);
 

module.exports = router;
