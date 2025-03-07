
const ProductCategoryModel = require("../models/productCategory")

const NotificationModel = require("../models/notification")

const addProductCategory = async (req, res) => {
   try {
      let body = req.body;
      let check = await ProductCategoryModel.findOne({ 
         categoryName: { 
            $regex: new RegExp('^' + body.categoryName.trim() + '$', 'i') 
         } 
      });

      if (check) {
         res.json({ status: false, msg: "Product Category already exists" });
      } else {
         let data = new ProductCategoryModel(body);
         if(req.body.userName){
            const notification = new NotificationModel({
               userId: data.userId,
               brandId: data.brandId,
               userName: data.productBrand,
               title: `Add Product Category By User ${req.body.userName}`,
               message: `A New Product Category Added in , ${req.body.userName}  User!`,
            });
            await notification.save();
         }
            if(req.body.brandName){
               const notification = new NotificationModel({
                  userId: data.userId,
                  brandId: data.brandId,
                  userName: data.productBrand,
                  title: `Add Product Category By Brand ${req.body.brandName}`,
                  message: `A New Product Category Added in , ${req.body.brandName}  Brand!`,
               });
            await notification.save();
         }
        
         await data.save();
         res.json({ status: true, msg: "Product Category Added" });
      }
   } catch (err) {
      res.status(400).send(err);
   }
};

 





const getAllProductCategory = async (req, res) => {
   try {
      let data = await ProductCategoryModel.find({}).sort({ _id: -1 });
      res.send(data);
   } catch (err) {
      res.status(400).send(err);
   }
}
const getProductCategoryById = async (req, res) => {
   try {
      let _id = req.params.id;
      let data = await ProductCategoryModel.findById(_id);
      res.send(data);
   } catch (err) {
      res.status(400).send(err);
   }
}

const editProductCategory = async (req, res) => {
   try {
      let _id = req.params.id;
      let body = req.body;
      let data = await ProductCategoryModel.findByIdAndUpdate(_id, body);
      res.json({ status: true, msg: "Product Updated" });
   } catch (err) {
      res.status(500).send(err);
   }
}
const deleteProductCategory = async (req, res) => {
   try {
      let _id = req.params.id;
      let data = await ProductCategoryModel.findByIdAndDelete(_id);
      if(data.userName){
         const notification = new NotificationModel({
            userId: data.userId,
            brandId: data.brandId,
            userName: data.productBrand,
            title: `  Product Category Deleted By User ${data.userName}`,
            message: `  Product Category Deleted in , ${data.userName}  User!`,
         });
         await notification.save();
      }
         if(data.brandName){
            const notification = new NotificationModel({
               userId: data.userId,
               brandId: data.brandId,
               userName: data.productBrand,
               title: `  Product Category Deleted By Brand ${data.brandName}`,
               message: ` Product Category Deleted in , ${data.brandName}  Brand!`,
            });
         await notification.save();
      }
      res.json({ status: true, msg: "Product Deteled" });
   } catch (err) {
      res.status(500).send(err);
   }
}

module.exports = { addProductCategory, getAllProductCategory, getProductCategoryById, editProductCategory, deleteProductCategory };

