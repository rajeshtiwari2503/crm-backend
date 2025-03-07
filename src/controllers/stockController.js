const BrandStockModel =require("../models/brandStock")
const CenterStockModel =require("../models/userStock")

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


const getAllBrandStock=async(req,res)=>{
    try{
        let data=await BrandStockModel.find({}).sort({ _id: -1 });
        res.send(data);
     }catch(err){
        res.status(400).send(err);
     }
}
const getAllUserStock=async(req,res)=>{
   try{
       let data=await CenterStockModel.find({}).sort({ _id: -1 });
       res.send(data);
    }catch(err){
       res.status(400).send(err);
    }
}
const getStockById=async(req,res)=>{
    try{
        let _id=req.params.id;
        let data=await BrandStockModel.findById(_id);
        res.send(data);
     }catch(err){
        res.status(400).send(err);
     }
}
const getStockByCenterId=async(req,res)=>{
   try{
       let _id=req.params.id;
       let data=await CenterStockModel.findById(_id);
       res.send(data);
    }catch(err){
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
 
 
 
 const deleteStock=async(req,res)=>{
    try{
        let _id=req.params.id;
        let data=await BrandStockModel.findByIdAndDelete(_id);
        res.json({status:true,msg:"Stock Deteled"});
     }catch(err){
        res.status(500).send(err);
     }
 }

module.exports = { addStock,getAllUserStock,getAllBrandStock,getStockById,getStockByCenterId,editStock,deleteStock };
