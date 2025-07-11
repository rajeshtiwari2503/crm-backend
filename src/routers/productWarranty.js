

const express = require("express");
const router = express.Router();
const ProductWarrantyModal = require("../models/productWarranty")
const { addProductWarranty, activateWarranty, getAllActivationWarrantyWithPage, getActivationWarrantySearch, getAllProductWarranty, getAllProductWarrantyByBrandStickers, editActivationWarranty, getActivationWarrantyByUserId, getAllProductWarrantyWithPage, getAllProductWarrantyByIdWithPage, getAllProductWarrantyByBrandIdTotal, getAllProductWarrantyById, getActivationWarrantyById, getAllActivationWarranty, getProductWarrantyByUniqueId, getProductWarrantyById, editProductWarranty, deleteProductWarranty } = require("../controllers/productWarrantyController")

router.post("/addProductWarranty", addProductWarranty);
router.post("/activateWarranty", activateWarranty);
router.get("/getAllProductWarranty", getAllProductWarranty);
router.get("/getAllProductWarrantyByBrandStickers", getAllProductWarrantyByBrandStickers);
router.get("/getAllProductWarrantyWithPage", getAllProductWarrantyWithPage);
router.get("/getAllProductWarrantyByIdWithPage/:id", getAllProductWarrantyByIdWithPage);
router.get("/getAllProductWarrantyById/:id", getAllProductWarrantyById);
router.get("/getAllProductWarrantyByBrandIdTotal/:id", getAllProductWarrantyByBrandIdTotal);
router.get("/getAllActivationWarranty", getAllActivationWarranty);
router.get("/getAllActivationWarrantyWithPage", getAllActivationWarrantyWithPage);
router.get("/getActivationWarrantySearch", getActivationWarrantySearch);
router.get("/getActivationWarrantyById/:id", getActivationWarrantyById);
router.get("/getActivationWarrantyByUserId/:id", getActivationWarrantyByUserId);
router.get("/getProductWarranty/:id", getProductWarrantyById);
router.get("/getProductWarrantyByUniqueId/:id", getProductWarrantyByUniqueId);
router.patch("/editProductWarranty/:id", editProductWarranty);
router.patch("/editActivationWarranty/", editActivationWarranty);
router.patch("/deleteProductWarranty/:id", deleteProductWarranty);

router.get('/warranty-analytics', async (req, res) => {
    try {
        const now = new Date();
        const startOfToday = new Date(now.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        // console.log("Date Ranges:");
        // console.log("Start of Today:", startOfToday.toISOString());
        // console.log("Start of Week:", startOfWeek.toISOString());
        // console.log("Start of Year:", startOfYear.toISOString());

        const result = await ProductWarrantyModal.aggregate([
            { $unwind: "$records" },
            {
                $match: {
                    "records.isActivated": true,
                    "records.activationDate": { $ne: null }
                }
            },
            {
                $facet: {
                    today: [
                        { $match: { "records.activationDate": { $gte: startOfToday } } },
                        { $count: "count" }
                    ],
                    thisWeek: [
                        { $match: { "records.activationDate": { $gte: startOfWeek } } },
                        { $count: "count" }
                    ],
                    thisMonth: [
                        { $match: { "records.activationDate": { $gte: startOfMonth } } },
                        { $count: "count" }
                    ],
                    thisYear: [
                        { $match: { "records.activationDate": { $gte: startOfYear } } },
                        { $count: "count" }
                    ],
                    byBrandProductLocation: [
                        {
                            $group: {
                                _id: {
                                    brandName: "$records.brandName",
                                    productName: "$records.productName",
                                    state: "$records.state",
                                    district: "$records.district"
                                },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { count: -1 } }
                    ]
                }
            }
        ]);

        // console.log("Aggregation Result:", JSON.stringify(result, null, 2));

        const response = {
            todayActivated: result[0].today?.[0]?.count || 0,
            weekActivated: result[0].thisWeek?.[0]?.count || 0,
            monthActivated: result[0].thisMonth?.[0]?.count || 0,
            yearActivated: result[0].thisYear?.[0]?.count || 0,
            groupedAnalytics: result[0].byBrandProductLocation || []
        };

        res.status(200).json(response);
    } catch (err) {
        console.error('Error in analytics API:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/warranty-analyticsByBrand', async (req, res) => {
    try {
        const { brand } = req.query;
        // console.log("brand", brand);

        const now = new Date();
        const startOfToday = new Date(now.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const matchStage = {
            "records.isActivated": true,
            "records.activationDate": { $ne: null },
        };

        if (brand) {
            // Filter only this brand’s records
            matchStage["records.brandName"] = brand;
        }

        const result = await ProductWarrantyModal.aggregate([
            { $unwind: "$records" },
            { $match: matchStage },
            {
                $facet: {
                    today: [
                        { $match: { "records.activationDate": { $gte: startOfToday } } },
                        { $count: "count" }
                    ],
                    thisWeek: [
                        { $match: { "records.activationDate": { $gte: startOfWeek } } },
                        { $count: "count" }
                    ],
                    thisMonth: [
                        { $match: { "records.activationDate": { $gte: startOfMonth } } },
                        { $count: "count" }
                    ],
                    thisYear: [
                        { $match: { "records.activationDate": { $gte: startOfYear } } },
                        { $count: "count" }
                    ],
                    byBrandProductLocation: [
                        {
                            $group: {
                                _id: {
                                    brandName: "$records.brandName",
                                    productName: "$records.productName",
                                    state: "$records.state",
                                    district: "$records.district"
                                },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { count: -1 } }
                    ]
                }
            }
        ]);

        res.json({
            todayActivated: result[0].today?.[0]?.count || 0,
            weekActivated: result[0].thisWeek?.[0]?.count || 0,
            yearActivated: result[0].thisYear?.[0]?.count || 0,
            monthActivated: result[0].thisMonth?.[0]?.count || 0,
            groupedAnalytics: result[0].byBrandProductLocation || []
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});






module.exports = router;