const OrderModel = require("../models/order")
const BrandStockModel = require("../models/brandStock")
const UserStockModel = require("../models/userStock")

// const addOrder = async (req, res) => {

//     try {
//         let body = req.body;
//         let data = new OrderModel(body);
//         await data.save();
//         res.json({ status: true, msg: "Order   Added" });
//     } catch (err) {
//         res.status(400).send(err);
//     }

// };


// const addOrder = async (req, res) => {
//     try {
//       let body = req.body;
//       let { quantity, sparepartId } = body;

//       // Retrieve the product to check the stock quantity
//       const sparePart = await BrandStockModel.findOne({ sparepartId: sparepartId });

//       if (!sparePart) {
//         return res.status(404).json({ status: false, msg: "Spare part not found" });
//       }

//       // Check if there is enough stock to fulfill the order
//       if (parseInt(sparePart.freshStock) < quantity) {
//         return res.json({ status: false, msg: "Insufficient stock" });
//       }

//       // Deduct the order quantity from the stock
//       sparePart.freshStock = parseInt(sparePart.freshStock) - quantity;

//       // Save the updated product stock
//       await sparePart.save();

//       // Create a new order
//       let data = new OrderModel(req.body);
//       await data.save();

//       res.json({ status: true, msg: "Order Added" });
//     } catch (err) {
//       console.error('Error in addOrder:', err);
//       res.status(400).send(err);
//     }
//   };

// const addOrder2025 = async (req, res) => {
//     try {
//       let body = req.body;
//       let { quantity, sparepartId, serviceCenterId,serviceCenter } = body;

//       // Retrieve the spare part to check the stock quantity
//       const sparePart = await BrandStockModel.findOne({ sparepartId: sparepartId });

//       if (!sparePart) {
//         return res.status(404).json({ status: false, msg: "Spare part not found" });
//       }

//       // Check if there is enough stock to fulfill the order
//       if (parseInt(sparePart.freshStock) < quantity) {
//         return res.json({ status: false, msg: "Insufficient stock" });
//       }

//       // Deduct the order quantity from the stock
//       sparePart.freshStock = parseInt(sparePart.freshStock) - quantity;

//       // Save the updated product stock
//       await sparePart.save();

//       // Update the service center stock if serviceCenterId is provided
//       if (serviceCenterId) {
//         const serviceCenterStock = await UserStockModel.findOne({ serviceCenterId: serviceCenterId, sparepartId: sparepartId });

//         if (serviceCenterStock) {
//           // If the spare part is already in the service center stock, update the quantity
//           serviceCenterStock.freshStock = parseInt(serviceCenterStock.freshStock) + quantity;
//         //   serviceCenterStock.freshStock += quantity;
//         await serviceCenterStock.save();
//         } else {
//           // If the spare part is not in the service center stock, create a new entry
//           await UserStockModel.create({
//             serviceCenterId: serviceCenterId,
//             serviceCenterName: serviceCenter,
//             sparepartId: sparepartId,
//             sparepartName: sparePart.name,
//             freshStock: quantity,
//           });
//         }


//       }

//       // Create a new order
//       let data = new OrderModel(req.body);
//       await data.save();

//       res.json({ status: true, msg: "Order Added" });
//     } catch (err) {
//       console.error('Error in addOrder:', err);
//       res.status(400).send(err);
//     }
//   };

// const addOrder = async (req, res) => {
//   try {
//       let { spareParts, serviceCenterId, serviceCenter, docketNo, trackLink } = req.body;

//       if (!spareParts || spareParts.length === 0) {
//           return res.status(400).json({ status: false, msg: "No spare parts selected" });
//       }

//       let chalanImage = req.file ? req.file.path : null; // Store image path

//       for (const part of spareParts) {
//           let { sparePartId, quantity } = part;

//           // Retrieve spare part stock
//           const sparePart = await BrandStockModel.findOne({ sparepartId: sparePartId });

//           if (!sparePart) {
//               return res.status(404).json({ status: false, msg: `Spare part not found: ${sparePartId}` });
//           }

//           if (parseInt(sparePart.freshStock) < quantity) {
//               return res.status(400).json({ status: false, msg: `Insufficient stock for ${sparePart?.sparePartName}` });
//           }

//           // Deduct quantity from brand stock
//           sparePart.freshStock = parseInt(sparePart.freshStock) - quantity;
//           await sparePart.save();

//           // Update service center stock
//           if (serviceCenterId) {
//               const serviceCenterStock = await UserStockModel.findOne({ serviceCenterId, sparepartId: sparePartId });

//               if (serviceCenterStock) {
//                   serviceCenterStock.freshStock = parseInt(serviceCenterStock.freshStock) + quantity;
//                   await serviceCenterStock.save();
//               } else {
//                   await UserStockModel.create({
//                       serviceCenterId,
//                       serviceCenterName: serviceCenter,
//                       sparepartId: sparePartId,
//                       sparepartName: sparePart.name,
//                       freshStock: quantity,
//                   });
//               }
//           }
//       }

//       // Save the order with the uploaded image path
//       let newOrder = new OrderModel({
//           spareParts,
//           serviceCenterId,
//           serviceCenter,
//           docketNo,
//           trackLink,
//           chalanImage, // Store image path in MongoDB
//       });

//       await newOrder.save();

//       res.json({ status: true, msg: "Order Added", order: newOrder });
//   } catch (err) {
//       console.error("Error in addOrder:", err);
//       res.status(500).json({ status: false, msg: "Internal Server Error" });
//   }
// };


const addOrder = async (req, res) => {
  try {
    let { spareParts,brandApproval, serviceCenterId, serviceCenter, docketNo, trackLink, brandId, brandName } = req.body;

    // Convert spareParts from string to an array if needed
    if (typeof spareParts === "string") {
      try {
        spareParts = JSON.parse(spareParts);
      } catch (error) {
        return res.status(400).json({ status: false, msg: "Invalid spareParts format" });
      }
    }

    if (!Array.isArray(spareParts) || spareParts.length === 0) {
      return res.status(400).json({ status: false, msg: "No spare parts selected" });
    }

    let chalanImage = req.file ? req.file.location : null;

    // Ensure freshStock is a number before processing
    for (const part of spareParts) {
      let { sparePartId, quantity } = part;
      let numericQuantity = parseInt(quantity, 10) || 0; // Ensure quantity is a number

      let sparePart = await BrandStockModel.findOne({ sparepartId: sparePartId });

      if (!sparePart) {
        return res.status(404).json({ status: false, msg: `Spare part not found: ${sparePartId}` });
      }

      // Convert freshStock to a number if it's a string
      if (typeof sparePart.freshStock !== "number") {
        sparePart.freshStock = parseInt(sparePart.freshStock, 10) || 0;
      }

      if (sparePart.freshStock < numericQuantity) {
        return res.status(400).json({ status: false, msg: `Insufficient stock for ${sparePart.sparePartName}` });
      }
    }

    // **Step 1: Create order first**
    let newOrder = new OrderModel({
      spareParts,
      brandId,
      brandName,
      serviceCenterId,
      serviceCenter,
      docketNo,
      brandApproval,
      trackLink,
      chalanImage,
    });

    await newOrder.save();

    // **Step 2: Prepare stock updates**
    let brandStockUpdates = [];
    let userStockUpdates = [];

    for (const part of spareParts) {
      let { sparePartId, quantity, sparePartName } = part;
      let numericQuantity = parseInt(quantity, 10) || 0; // Ensure quantity is a number

      // **Step 2a: Decrease freshStock separately**
      brandStockUpdates.push({
        updateOne: {
          filter: { sparepartId: sparePartId },
          update: { $inc: { freshStock: -numericQuantity } }, // Reduce freshStock
        },
      });

      // **Step 2b: Push stock entry separately**
      brandStockUpdates.push({
        updateOne: {
          filter: { sparepartId: sparePartId },
          update: {
            $push: {
              stock: {
                fresh: -numericQuantity,
                title: "Admin Order",
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
          },
        },
      });

      // **Step 3: Update service center stock (increase stock)**
      if (serviceCenterId) {
        let serviceCenterStock = await UserStockModel.findOne({ serviceCenterId, sparepartId: sparePartId });

        if (serviceCenterStock) {
          // Convert freshStock to a number if it's a string
          if (typeof serviceCenterStock.freshStock !== "number") {
            await UserStockModel.updateOne(
              { serviceCenterId, sparepartId: sparePartId },
              { $set: { freshStock: parseInt(serviceCenterStock.freshStock, 10) || 0 } }
            );
          }

          userStockUpdates.push({
            updateOne: {
              filter: { serviceCenterId, sparepartId: sparePartId },
              update: {
                $inc: { freshStock: numericQuantity }, // Increase freshStock
                $push: {
                  stock: {
                    fresh: -numericQuantity,
                    title: "Admin Order",
                    createdAt: new Date(),
                    updatedAt: new Date()
                  }
                }
              },
            },
          });
        } else {
          await UserStockModel.create({
            serviceCenterId,
            serviceCenterName: serviceCenter,
            sparepartId: sparePartId,
            sparepartName: sparePartName,
            brandId: brandId,
            brandName: brandName,
            freshStock: numericQuantity, // Ensure freshStock is a number
            stock: [{
              fresh: numericQuantity,
              title: "Admin Order",
              createdAt: new Date(),
              updatedAt: new Date()
            }]
          });
        }
      }


    }

    // **Step 4: Execute stock updates**
    if (brandStockUpdates.length > 0) {
      await BrandStockModel.bulkWrite(brandStockUpdates);
    }
    if (userStockUpdates.length > 0) {
      await UserStockModel.bulkWrite(userStockUpdates);
    }

    res.json({ status: true, msg: "Order Added and Stock Updated", order: newOrder });

  } catch (err) {
    console.error("Error in addOrder:", err);
    res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
};

const addCenterOrder = async (req, res) => {
  try {
    let { spareParts,brandApproval, serviceCenterId, serviceCenter, docketNo, trackLink, brandId, brandName } = req.body;

    // Convert spareParts from string to an array if needed
    if (typeof spareParts === "string") {
      try {
        spareParts = JSON.parse(spareParts);
      } catch (error) {
        return res.status(400).json({ status: false, msg: "Invalid spareParts format" });
      }
    }

    if (!Array.isArray(spareParts) || spareParts.length === 0) {
      return res.status(400).json({ status: false, msg: "No spare parts selected" });
    }

    let chalanImage = req.file ? req.file.location : null;

    // Ensure freshStock is a number before processing
    for (const part of spareParts) {
      let { sparePartId, quantity } = part;
      let numericQuantity = parseInt(quantity, 10) || 0; // Ensure quantity is a number

      let sparePart = await BrandStockModel.findOne({ sparepartId: sparePartId });

      if (!sparePart) {
        return res.status(404).json({ status: false, msg: `Spare part not found: ${sparePartId}` });
      }

     
    }

    // **Step 1: Create order first**
    let newOrder = new OrderModel({
      spareParts,
      brandId,
      brandName,
      serviceCenterId,
      serviceCenter,
      docketNo,
      brandApproval,
      trackLink,
      chalanImage,
    });

    await newOrder.save();

    

    res.json({ status: true, msg: "Order Added ", order: newOrder });

  } catch (err) {
    console.error("Error in addOrder:", err);
    res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
};
// const approvalServiceOrder = async (req, res) => {
//   try {
//     let { spareParts, serviceCenterId, serviceCenter,  brandId, brandName } = req.body;

//     // Convert spareParts from string to an array if needed
//     if (typeof spareParts === "string") {
//       try {
//         spareParts = JSON.parse(spareParts);
//       } catch (error) {
//         return res.status(400).json({ status: false, msg: "Invalid spareParts format" });
//       }
//     }

//     if (!Array.isArray(spareParts) || spareParts.length === 0) {
//       return res.status(400).json({ status: false, msg: "No spare parts selected" });
//     }

  

//     // Ensure freshStock is a number before processing
//     for (const part of spareParts) {
//       let { sparePartId, quantity } = part;
//       let numericQuantity = parseInt(quantity, 10) || 0; // Ensure quantity is a number

//       let sparePart = await BrandStockModel.findOne({ sparepartId: sparePartId });

//       if (!sparePart) {
//         return res.status(404).json({ status: false, msg: `Spare part not found: ${sparePartId}` });
//       }

//       // Convert freshStock to a number if it's a string
//       if (typeof sparePart.freshStock !== "number") {
//         sparePart.freshStock = parseInt(sparePart.freshStock, 10) || 0;
//       }

//       if (sparePart.freshStock < numericQuantity) {
//         return res.status(400).json({ status: false, msg: `Insufficient stock for ${sparePart.sparePartName}` });
//       }
//     }

     

//     // **Step 2: Prepare stock updates**
//     let brandStockUpdates = [];
//     let userStockUpdates = [];

//     for (const part of spareParts) {
//       let { sparePartId, quantity, sparePartName } = part;
//       let numericQuantity = parseInt(quantity, 10) || 0; // Ensure quantity is a number

//       // **Step 2a: Decrease freshStock separately**
//       brandStockUpdates.push({
//         updateOne: {
//           filter: { sparepartId: sparePartId },
//           update: { $inc: { defectiveStock: +numericQuantity } }, // Reduce freshStock
//         },
//       });

//       // **Step 2b: Push stock entry separately**
//       brandStockUpdates.push({
//         updateOne: {
//           filter: { sparepartId: sparePartId },
//           update: {
//             $push: {
//               stock: {
//                 defective: +numericQuantity,
//                 title: "Admin Order",
//                 createdAt: new Date(),
//                 updatedAt: new Date(),
//               },
//             },
//           },
//         },
//       });

//       // **Step 3: Update service center stock (increase stock)**
//       if (serviceCenterId) {
//         let serviceCenterStock = await UserStockModel.findOne({ serviceCenterId, sparepartId: sparePartId });

//         if (serviceCenterStock) {
//           // Convert freshStock to a number if it's a string
//           if (typeof serviceCenterStock.defectiveStock !== "number") {
//             await UserStockModel.updateOne(
//               { serviceCenterId, sparepartId: sparePartId },
//               { $set: { defectiveStock: parseInt(serviceCenterStock.defectiveStock, 10) || 0 } }
//             );
//           }
          
//           userStockUpdates.push({
//             updateOne: {
//               filter: { serviceCenterId, sparepartId: sparePartId },
//               update: {
//                 $inc: { defectiveStock: numericQuantity }, // Increase freshStock
//                 $push: {
//                   stock: {
//                     defective: +numericQuantity,
//                     title: "Service Order",
//                     createdAt: new Date(),
//                     updatedAt: new Date()
//                   }
//                 }
//               },
//             },
//           });
//         } else {
//           await UserStockModel.create({
//             serviceCenterId,
//             serviceCenterName: serviceCenter,
//             sparepartId: sparePartId,
//             sparepartName: sparePartName,
//             brandId: brandId,
//             brandName: brandName,
//             defectiveStock: numericQuantity, // Ensure freshStock is a number
//             stock: [{
//               defective: numericQuantity,
//               title: "Service Order",
//               createdAt: new Date(),
//               updatedAt: new Date()
//             }]
//           });
//         }
//       }


//     }

//     // **Step 4: Execute stock updates**
//     if (brandStockUpdates.length > 0) {
//       await BrandStockModel.bulkWrite(brandStockUpdates);
//     }
//     if (userStockUpdates.length > 0) {
//       await UserStockModel.bulkWrite(userStockUpdates);
//     }

//     res.json({ status: true, msg: "Order Added and Stock Updated", order: newOrder });

//   } catch (err) {
//     console.error("Error in addOrder:", err);
//     res.status(500).json({ status: false, msg: "Internal Server Error" });
//   }
// };
 

const approvalServiceOrder = async (req, res) => {
  try {
    let { orderId, spareParts, serviceCenterId, serviceCenter, brandId, brandName } = req.body;

    if (typeof spareParts === "string") {
      try {
        spareParts = JSON.parse(spareParts);
      } catch (error) {
        console.error("Error parsing spareParts:", error);
        return res.status(400).json({ status: false, msg: "Invalid spareParts format" });
      }
    }

    if (!Array.isArray(spareParts) || spareParts.length === 0) {
      console.error("No spare parts selected");
      return res.status(400).json({ status: false, msg: "No spare parts selected" });
    }

    let brandStockUpdates = [];
    let userStockUpdates = [];

    for (const part of spareParts) {
      let { sparePartId, quantity, sparePartName } = part;
      let numericQuantity = parseInt(quantity, 10) || 0;

      let sparePart = await BrandStockModel.findOne({ sparepartId: sparePartId });

      if (!sparePart) {
        return res.status(404).json({ status: false, msg: `Spare part not found: ${sparePartId}` });
      }

      if (typeof sparePart.defectiveStock !== "number") {
        console.warn(`Fixing defectiveStock for sparePartId: ${sparePartId}`);
        await BrandStockModel.updateOne(
          { sparepartId: sparePartId },
          { $set: { defectiveStock: parseInt(sparePart.defectiveStock, 10) || 0 } }
        );
        sparePart = await BrandStockModel.findOne({ sparepartId: sparePartId });
      }

      // **Update Brand Stock Manually Without `$inc`**
      const updatedDefectiveStock = sparePart.defectiveStock + numericQuantity;
      brandStockUpdates.push({
        updateOne: {
          filter: { sparepartId: sparePartId },
          update: { $set: { defectiveStock: updatedDefectiveStock } },
        },
      });

      brandStockUpdates.push({
        updateOne: {
          filter: { sparepartId: sparePartId },
          update: {
            $push: {
              stock: {
                defective: numericQuantity,
                title: "Service Order",
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
          },
        },
      });

      if (serviceCenterId) {
        let serviceCenterStock = await UserStockModel.findOne({ serviceCenterId, sparepartId: sparePartId });

        if (serviceCenterStock) {
          if (typeof serviceCenterStock.defectiveStock !== "number") {
            await UserStockModel.updateOne(
              { serviceCenterId, sparepartId: sparePartId },
              { $set: { defectiveStock: parseInt(serviceCenterStock.defectiveStock, 10) || 0 } }
            );
            serviceCenterStock = await UserStockModel.findOne({ serviceCenterId, sparepartId: sparePartId });
          }

          // **Update Service Center Stock Manually Without `$inc`**
          const updatedUserDefectiveStock = serviceCenterStock.defectiveStock + numericQuantity;
          userStockUpdates.push({
            updateOne: {
              filter: { serviceCenterId, sparepartId: sparePartId },
              update: {
                $set: { defectiveStock: updatedUserDefectiveStock },
                $push: {
                  stock: {
                    defective: numericQuantity,
                    title: "Service Order",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                },
              },
            },
          });
        } else {
          await UserStockModel.create({
            serviceCenterId,
            serviceCenterName: serviceCenter,
            sparepartId: sparePartId,
            sparepartName: sparePartName,
            brandId: brandId,
            brandName: brandName,
            defectiveStock: numericQuantity,
            stock: [
              {
                defective: numericQuantity,
                title: "Service Order",
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          });
        }
      }
    }

    if (brandStockUpdates.length > 0) {
      try {
        await BrandStockModel.bulkWrite(brandStockUpdates);
      } catch (error) {
        console.error("Error updating BrandStockModel:", error);
      }
    }

    if (userStockUpdates.length > 0) {
      try {
        await UserStockModel.bulkWrite(userStockUpdates);
      } catch (error) {
        console.error("Error updating UserStockModel:", error);
      }
    }

    if (orderId) {
      let order = await OrderModel.findById(orderId);
      if (!order) {
        return res.status(404).json({ status: false, msg: `Order not found: ${orderId}` });
      }

      await OrderModel.updateOne({ _id: orderId }, { $set: { brandApproval: "APPROVED" } });
    }

    res.json({ status: true, msg: "Order Approved, Stock Updated" });

  } catch (err) {
    console.error("Unexpected Error in approvalServiceOrder:", err.message, err.stack);
    res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
};



 








const addDefectiveOrder = async (req, res) => {
  try {
    let body = req.body;
    let { quantity, sparepartId, serviceCenterId, serviceCenter } = body;


    const sparePart = await BrandStockModel.findOne({ sparepartId: sparepartId });

    if (!sparePart) {
      return res.status(404).json({ status: false, msg: "Spare part not found" });
    }

    sparePart.defectiveStock = parseInt(sparePart.defectiveStock) + quantity;


    await sparePart.save();

    // Update the service center stock if serviceCenterId is provided
    if (serviceCenterId) {
      const serviceCenterStock = await UserStockModel.findOne({ serviceCenterId: serviceCenterId, sparepartId: sparepartId });

      if (serviceCenterStock) {
        // If the spare part is already in the service center stock, update the quantity
        serviceCenterStock.defectiveStock = parseInt(serviceCenterStock.defectiveStock) + quantity;
        //   serviceCenterStock.freshStock += quantity;
        await serviceCenterStock.save();
      } else {
        // If the spare part is not in the service center stock, create a new entry
        await UserStockModel.create({
          serviceCenterId: serviceCenterId,
          serviceCenterName: serviceCenter,
          sparepartId: sparepartId,
          sparepartName: sparePart.name,
          defectiveStock: quantity,
        });
      }


    }

    // Create a new order
    let data = new OrderModel(req.body);
    await data.save();

    res.json({ status: true, msg: "Order Added" });
  } catch (err) {
    console.error('Error in addOrder:', err);
    res.status(400).send(err);
  }
};

const getAllOrder = async (req, res) => {
  try {
    let data = await OrderModel.find({}).sort({ _id: -1 });
    res.send(data);
  } catch (err) {
    res.status(400).send(err);
  }
}
const getAllOrderById = async (req, res) => {
  try {
    const { brandId, serviceCenterId } = req.query;

    let query = {};
    if (brandId) {
      query.brandId = brandId;
    }
    if (serviceCenterId) {
      query.serviceCenterId = serviceCenterId;
    }


    let data = await OrderModel.find(query).sort({ _id: -1 });



    res.send(data);
  } catch (err) {
    console.error('Error in getAllOrderById:', err);
    res.status(400).send(err);
  }
};


const getOrderById = async (req, res) => {
  try {
    let _id = req.params.id;
    let data = await OrderModel.findById(_id);
    res.send(data);
  } catch (err) {
    res.status(400).send(err);
  }
}

const editOrder = async (req, res) => {
  try {
    let _id = req.params.id;
    let body = req.body;
    let data = await OrderModel.findByIdAndUpdate(_id, body);
    res.json({ status: true, msg: "Order Updated" });
  } catch (err) {
    res.status(500).send(err);
  }
}
const deleteOrder = async (req, res) => {
  try {
    let _id = req.params.id;
    let data = await OrderModel.findByIdAndDelete(_id);
    res.json({ status: true, msg: "Order Deteled" });
  } catch (err) {
    res.status(500).send(err);
  }
}

module.exports = { addOrder,addCenterOrder,approvalServiceOrder, addDefectiveOrder, getAllOrder, getAllOrderById, getOrderById, editOrder, deleteOrder };
