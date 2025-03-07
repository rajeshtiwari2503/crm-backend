const mongoose =require("mongoose")

const sparePartSchema=new mongoose.Schema({
 
  brandId:{type:String},
  brandName:{type:String},
  productId:{type:String    },
  skuNo:{type:String    },
  length:{type:Number    },
  breadth:{type:Number    },
  height:{type:Number    },
  weight:{type:Number    },
  
  seller:{type:String},
  MRP:{type:Number    },
  bestPrice:{type:Number    },
  description:{type:String    },
  partName:{type:String    },
  category:{type:String    },
  productModel:{type:String    },
  products: [
    {
      productName:{type:String },
      productId:{type:String },
    },
  ],
  partNo:{type:String    },
  faultType:{type:Array},
  technician:{type:Number},
  images:{type:Array    },
        adminId:{type:String },
       
     
        status:{type:String,default:"ACTIVE"}
  
  },{timestamps:true}
);

const SparePartModal=new mongoose.model("SpareParts",sparePartSchema);

module.exports=SparePartModal;