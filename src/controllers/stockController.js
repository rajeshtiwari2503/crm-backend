const BrandStockModel = require("../models/brandStock");
const StockRequestModel = require("../models/stockRequestModel");
const CenterStockModel = require("../models/userStock")
const OrderModel = require("../models/order");
const UserStockModel = require("../models/userStock");

const addStock = async (req, res) => {
   try {
      const { sparepartName } = req.body;

      // Check if the spare part name already exists
      const existingSparePart = await BrandStockModel.findOne({ sparepartName });
      if (existingSparePart) {
         return res.json({ status: false, msg: "Spare part name already exists in stocks" });
      }

      // If not, proceed to add the new spare part
      const data = new BrandStockModel(req.body);
      await data.save();
      res.json({ status: true, msg: "Stock Added" });
   } catch (err) {
      res.status(400).send(err);
   }
};


const requestCenterStock = async (req, res) => {
   try {
      const {
         serviceCenterId,
         serviceCenterName,
         brandId,
         brandName,
         sparepartId,
         sparepartName,
         stockId,
         fresh,
         defective,
         price,
         title
      } = req.body;

      // Build the request data with proper type conversion
      const data = new StockRequestModel({
         serviceCenterId,
         serviceCenterName,
         brandId,
         brandName,
         sparepartId,
         sparepartName,
         stockId,
         fresh: parseInt(fresh || '0', 10),
         defective: parseInt(defective || '0', 10),
         price: parseFloat(price || '0'),
         title,
         status: 'pending',
         createdAt: new Date(),
      });

      await data.save();

      return res.json({
         status: true,
         msg: "Stock request submitted for approval",
         data,
      });
   } catch (err) {
      console.error("Request Stock Error:", err);
      return res.status(500).json({
         status: false,
         msg: "Server Error",
         error: err.message,
      });
   }
};



const getAllBrandStock = async (req, res) => {
   try {
      let data = await BrandStockModel.find({}).sort({ _id: -1 });
      res.send(data);
   } catch (err) {
      res.status(400).send(err);
   }
}
const getAllUserStock = async (req, res) => {
   try {
      let data = await CenterStockModel.find({}).sort({ _id: -1 });
      res.send(data);
   } catch (err) {
      res.status(400).send(err);
   }
}
const getStockById1 = async (req, res) => {
   try {
      let _id = req.params.id;
      let data = await BrandStockModel.findById(_id);
      res.send(data);
   } catch (err) {
      res.status(400).send(err);
   }
}

// const getStockById = async (req, res) => {
//    try {
//       const brandStockId = req.params.id;

//       // 1️⃣ Find the brand stock by ID
//       const brandStock = await BrandStockModel.findById(brandStockId).lean();
//       if (!brandStock) {
//          return res.status(404).json({ message: "Brand stock not found" });
//       }

//       const sparepartId = brandStock.sparepartId;

//       // 2️⃣ Fetch all user stock documents for this sparepart
//       const userStocks = await UserStockModel.find({ sparepartId }).lean();
//       if (!userStocks || userStocks.length === 0) {
//          return res.status(404).json({ message: "No user stocks found for this sparepart" });
//       }

//       // 3️⃣ Build the response
//       const response = {
//          _id: brandStock._id,
//          brandId: brandStock.brandId,
//          brandName: brandStock.brandName,
//          sparepartId: brandStock.sparepartId,
//          sparepartName: brandStock.sparepartName,
//          totalStock: brandStock.totalStock || null, // or freshStock/defectiveStock if needed
//          freshStock: brandStock.freshStock || 0,
//          defectiveStock: brandStock.defectiveStock || 0,
//          createdAt: brandStock.createdAt,
//          updatedAt: brandStock.updatedAt,
//          serviceCenters: userStocks.map(us => ({
//             _id: us._id,
//             serviceCenterId: us.serviceCenterId,
//             serviceCenterName: us.serviceCenterName,
//             freshStock: us.freshStock,
//             defectiveStock: us.defectiveStock,
//             stock: us.stock
//          }))
//       };

//       res.json(response);
//    } catch (err) {
//       console.error(err);
//       res.status(500).json({ error: err.message });
//    }
// };

const getStockById = async (req, res) => {
  try {
    const _id = req.params.id;

    // 1️⃣ Find the brand stock by ID
    const brandStock = await BrandStockModel.findById(_id).lean();
    if (!brandStock) {
      return res.status(404).json({ message: "Brand stock not found" });
    }

    // 2️⃣ Find all user stocks (service centers) for the same sparepart
    const userStocks = await UserStockModel.find({ sparepartId: brandStock.sparepartId }).lean();

    // 3️⃣ Merge all service center stocks into brandStock.stock array
    const serviceCenterStocks = userStocks.map(us => ({
      serviceCenterId: us.serviceCenterId,
      serviceCenterName: us.serviceCenterName,
      freshStock: us.freshStock,
      defectiveStock: us.defectiveStock,
      stock: us.stock
    }));

    // 4️⃣ Build final response
    const response = {
      ...brandStock,
      serviceCenters: serviceCenterStocks
    };

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const getStockByCenterId = async (req, res) => {
   try {
      let _id = req.params.id;
      let data = await CenterStockModel.findById(_id);
      res.send(data);
   } catch (err) {
      res.status(400).send(err);
   }
}
// const editStock=async (req,res)=>{
//     try{
//         let _id=req.params.id;
//         let body=req.body;
//         let data=await BrandStockModel.findByIdAndUpdate(_id,body);
//         res.json({status:true,msg:"Stock Updated"});
//      }catch(err){
//         res.status(500).send(err);
//      }
// }
const getAllStockRequests = async (req, res) => {
   try {
      const stockRequests = await StockRequestModel.find()
         .populate("stockId")           // optional: populate related stock
         .populate("serviceCenterId")   // optional: populate service center
         .populate("sparepartId")       // optional: populate spare part
         .sort({ createdAt: -1 });      // latest first

      if (!stockRequests || stockRequests.length === 0) {
         return res.status(404).json({
            status: false,
            msg: "No stock requests found",
         });
      }

      return res.status(200).json({
         status: true,
         msg: "Stock requests fetched successfully",
         data: stockRequests,
      });
   } catch (err) {
      console.error("Get All Stock Requests Error:", err);
      return res.status(500).json({
         status: false,
         msg: "Server error",
         error: err.message,
      });
   }
};
const getAllCenterStockRequests = async (req, res) => {
   try {
      let _id = req.params.id; // serviceCenterId passed as URL param

      const stockRequests = await StockRequestModel.find({ serviceCenterId: _id })
         .populate("stockId")
         .populate("serviceCenterId")
         .populate("sparepartId")
         .sort({ createdAt: -1 });

      if (!stockRequests || stockRequests.length === 0) {
         return res.status(404).json({
            status: false,
            msg: "No stock requests found for this service center",
         });
      }

      return res.status(200).json({
         status: true,
         msg: "Stock requests fetched successfully",
         data: stockRequests,
      });
   } catch (err) {
      console.error("Get Stock Requests by Service Center Error:", err);
      return res.status(500).json({
         status: false,
         msg: "Server error",
         error: err.message,
      });
   }
};



const getStockRequestByStockId = async (req, res) => {
   try {
      let _id = req.params.id;
      const stockId = _id;
      if (!stockId) {
         return res.status(400).json({ status: false, msg: "stockId is required" });
      }

      const data = await StockRequestModel.find({ stockId });

      if (!data || data.length === 0) {
         return res.status(404).json({ status: false, msg: "No stock requests found for this stockId" });
      }

      res.send(data);
   } catch (err) {
      console.error("Get Stock Request Error:", err);
      res.status(500).json({ status: false, msg: "Server Error", error: err.message });
   }
};

const editStock = async (req, res) => {
   try {
      let _id = req.params.id;
      let { fresh, title } = req.body;

      // Find the BrandStock by ID
      let brandStock = await BrandStockModel.findById(_id);

      if (!brandStock) {
         return res.status(404).json({ status: false, msg: "Brand Stock not found" });
      }

      // Create the new stock entry
      const newStockEntry = {
         fresh,
         title,
         createdAt: Date.now(),
         updatedAt: Date.now(),
      };

      // Add new stock to the stock array
      brandStock.stock.push(newStockEntry);

      // Parse current freshStock (if it exists) and add the new fresh stock value
      let currentFreshStock = parseInt(brandStock.freshStock || '0', 10);
      let newFreshValue = parseInt(fresh || '0', 10);
      let updatedFreshStock = currentFreshStock + newFreshValue;

      // Update the freshStock field with the cumulative total
      brandStock.freshStock = updatedFreshStock.toString();

      // Save the updated document
      await brandStock.save();

      res.json({ status: true, msg: "Stock Updated", data: brandStock });
   } catch (err) {
      res.status(500).send(err);
   }
};


//  const editServiceCenterStock = async (req, res) => {
//   try {
//     const _id = req.params.id; // This is UserStock ID
//     const { fresh, defective, title } = req.body;

//     // Find UserStock by ID
//     const userStock = await CenterStockModel.findById(_id);

//     if (!userStock) {
//       return res.status(404).json({ status: false, msg: "User Stock not found" });
//     }

//     // Add stock entry to history (if you maintain history array)
//     const stockEntry = {
//       fresh: fresh || 0,
//       defective: defective || 0,
//       title,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     };

//     userStock.stock.push(stockEntry); // Optional: maintain stock logs

//     // Update freshStock and defectiveStock
//     userStock.freshStock = (parseInt(userStock.freshStock || '0') + parseInt(fresh || '0')).toString();
//     userStock.defectiveStock = (parseInt(userStock.defectiveStock || '0') + parseInt(defective || '0')).toString();

//     userStock.updatedAt = new Date();

//     await userStock.save();

//     res.json({ status: true, msg: "Service Center Stock Updated", data: userStock });
//   } catch (err) {
//     console.error("Edit Stock Error:", err);
//     res.status(500).json({ status: false, msg: "Server Error", error: err.message });
//   }
// };


const editServiceCenterStock = async (req, res) => {
   try {
      const requestId = req.params.id;
      const request = await StockRequestModel.findById(requestId);

      if (!request) {
         return res.status(404).json({ status: false, msg: "Stock request not found" });
      }

      if (request.status !== 'pending') {
         return res.status(400).json({ status: false, msg: "Stock request already processed" });
      }

      const {
         serviceCenterId,
         serviceCenterName,
         brandId,
         brandName,
         sparepartId,
         sparepartName,
         fresh,
         defective,
         title,
         price
      } = request;

      // Check if Center stock already exists
      let stock = await CenterStockModel.findOne({ serviceCenterId, sparepartId });

      if (!stock) {
         return res.status(404).json({ status: false, msg: "Stock request not found" });
      }

      else {
         // If exists, update stock
         stock.freshStock = (parseInt(stock.freshStock) + parseInt(fresh)).toString();
         stock.defectiveStock = (parseInt(stock.defectiveStock) + parseInt(defective)).toString();

         stock.stock.push({
            fresh,
            defective,
            title,
            price,
            createdAt: new Date(),
            updatedAt: new Date(),
         });
      }

      await stock.save();

      // Update the request status
      request.status = "approved";
      await request.save();

      res.json({ status: true, msg: "Stock request approved and updated", data: stock });
   } catch (err) {
      console.error("Approve Stock Request Error:", err);
      res.status(500).json({ status: false, msg: "Server Error", error: err.message });
   }
};

const deleteStock = async (req, res) => {
   try {
      let _id = req.params.id;
      let data = await BrandStockModel.findByIdAndDelete(_id);
      res.json({ status: true, msg: "Stock Deteled" });
   } catch (err) {
      res.status(500).send(err);
   }
}

module.exports = { addStock, requestCenterStock, getAllCenterStockRequests, getAllStockRequests, getStockRequestByStockId, getAllUserStock, getAllBrandStock, getStockById, getStockByCenterId, editStock, editServiceCenterStock, deleteStock };
