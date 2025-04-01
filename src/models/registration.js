const mongoose = require("mongoose");


const adminRegistrationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    contact: { type: Number, required: true },
    password: { type: String, required: true },
    role: { type: String, default: "ADMIN" },
},
    { timestamps: true });
  
const bradRegistrationSchema = new mongoose.Schema({
    brandName: {
        type: String,
        required: true
      },
      username: {
        type: String,
        // required: true
      },
      brandId: {
        type: String,
        // required: true
      },

      brandDescription: {
        type: String,
        required: true
      },

      serviceCategories:{type:Array},
      contactPersonName: {
        type: String,
        required: true
      },
      contactPersonEmail: {
        type: String,
        // required: true,
        // unique: true
      },
      contactPersonPhoneNumber: {
        type: String,
        required: true
      },
      streetAddress: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      postalCode: {
        type: String,
        required: true
      },
      country: {
        type: String,
        required: true
      },
      email: {
        type: String,
        // required: true,
        // unique: true
      },
      password: {
        type: String,
        required: true
      },
      websiteURL: {
        type: String
      },
      industry: {
        type: [String],
        required: true
      },
      companySize: {
        type: String,
        // required: true
      },
      termsAndConditions: {
        type: Boolean,
        // required: true
      },
      privacyPolicy: {
        type: Boolean,
        // required: true
      },
      brandLogo: {
        type: String
      },
      brandSaas: {
        type: String
      },
      tollfree: {
        type: String
      },
      warrantyCondition: {
        type: String
      },
      role: { type: String, default: "BRAND" },
      verification: { type: String, default: "VERIFIED" }
      , otp: { type: Number },
  
     
      basePrice: { type: String, default: "0" },
      kmPrice: { type: String, default: "0" },
      crmPrice: { type: String, default: "0" },
      perMonthPrice: { type: String, default: "0" },
      inCityPrice: { type: String, default: "0" },
      outCityPrice: { type: String, default: "0" },
      shaPrice: { type: String, default: "0" },
      bhaPrice: { type: String, default: "0" },

      status: { type: String, default: "ACTIVE" },
    }, { timestamps: true });
 
    const technicianSchema=new mongoose.Schema({
      brandName: { type: String},
      brandId: { type: String},
        name:{type:String,required:true},
        contact:{type:String,required:true},
        serviceName:{type:String },
        serviceCenterName:{type:String },
        serviceCenterId:{type:String },
        email:{type:String,required:true},
        password:{type:String },
        image:{type:String },
        fcmToken:{type:String },
        serviceId:{type:String },
        address:{type:String },
        certificate:{type:String },
        lat: { type: String  },
        long: { type: String  },
        skill:{type:String },
        type:{type:String },
        pincode:{type:String },
        liveStatus:{type:String,default:"AVAILABLE"},
        role: { type: String, default: "TECHNICIAN" },
        verification: { type: String, default: "VERIFIED" }
        , otp: { type: Number },
        status: { type: String, default: "ACTIVE" },
        totalAmount: { type: Number, default: 0 },
        walletAmount: { type: Number, default: 0 },
        acceptedTerms: {
          type: Boolean,
          
        },
  },{timestamps:true}
);


const serviceCenterRegistrationSchema = new mongoose.Schema({
  brandName: { type: String},
  brandId: { type: String},
    serviceCenterName: {
        type: String,
        // required: true
    },
    serviceCenterType: {
        type: String,
        // required: true
    },
    registrationNumber: {
        type: String,
        // required: true
    },
    tin: {
        type: String,
        // required: true
    },
    contactPersonName: {
        type: String,
        // required: true
    },
    contactPersonPosition: {
        type: String,
        // required: true
    },
    fcmToken:{type:String },
    email: {
        type: String,
        required: true,
        // match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    },
    contact: {
        type: String,
        // required: true
    },
    streetAddress: {
        type: String,
        // required: true
    },
    city: {
        type: String,
        // required: true
    },
    state: {
        type: String,
        // required: true
    },
    postalCode: {
        type: String,
        // required: true
    },
    country: {
        type: String,
        // required: true
    },
    serviceCategories:{type:Array},
    brandsSupported:{type:Array},
    pincodeSupported: {
        type: [String],
        
    },
    technicianCertifications: {
        type: String,
        // required: true
    },
    operatingHours: {
        type: String,
        // required: true
    },
    yearsInOperation: {
        type: String,
        // required: true
    },
    numberOfTechnicians: {
        type: String,
        // required: true
    },
    averageTurnaroundTime: {
        type: String,
        // required: true
    },
    insuranceCoverage: {
        type: Boolean,
        // default: false
    },
    username: {
        type: String,
        // required: true
    },
    password: {
        type: String,
        required: true
    },
    gstCertificate: {
        type: String  
    },
    identityProof: {
        type: String  
    },
    certificationDocuments: {
        type: String  
    },
    agreement: {
        type: Boolean,
        // required: true
    },
    privacyPolicy: {
        type: Boolean,
        // required: true
    },


    role: { type: String, default: "SERVICE" },
    verification: { type: String, default: "VERIFIED" }
    , otp: { type: Number },

    status: { type: String, default: "ACTIVE" },
    totalAmount: { type: Number, default: 0 },
    walletAmount: { type: Number, default: 0 }
}, { timestamps: true });



const employeeRegistrationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    contact: { type: Number, required: true },
    password: { type: String, required: true },
    brandId: { type: String },
    brandName: { type: String  },
    stateZone:{type:Array},
    role: { type: String, default: "EMPLOYEE" }
},
    { timestamps: true });
    const brandEmployeeRegistrationSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true },
      contact: { type: Number, required: true },
      password: { type: String, required: true },
      brandId: { type: Number, required: true },
      brandName: { type: String, required: true },
      role: { type: String, default: "BRAND EMPLOYEE" }
  },
      { timestamps: true });

const dealerRegistrationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    brandName: { type: String},
    brandId: { type: String},
    businessAddress: {
      type: String,
      // required: true,
    },
    fcmToken:{type:String },
    contactPerson: {
      type: String,
      // required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      // match: [/\S+@\S+\.\S+/, 'is invalid'],
    },
    contact: {
      type: String,
      // required: true,
      // match: [/^\d{10}$/, 'is invalid'], // Assuming phone number is a 10-digit number
    },
    businessRegistrationNumber: {
      type: String,
      // required: true,
    },
    gstVatNumber: {
      type: String,
      // required: true,
    },
    password: {
      type: String,
      // required: true,
    },
    acceptedTerms: {
      type: Boolean,
      // required: true,
    },
    // state: { type: String},
    // city: { type: String},
    // otherCities: { type: Array},
    locations: { type: Array},
    verification: { type: String, default: "VERIFIED" }
    , otp: { type: Number },
    role: { type: String, default: "DEALER" },
    totalAmount: { type: Number, default: 0 },
    walletAmount: { type: Number, default: 0 }
},
    { timestamps: true });

const userRegistrationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String  },
    contact: { type: String, required: true },
    password: { type: String  },
    address: { type: String  },
    pincode: { type: String  },
    lat: { type: String  },
    fcmToken:{type:String },
    long: { type: String  },
    role: { type: String, default: "USER" },
    verification: { type: String, default: "VERIFIED" }
    ,
    acceptedTerms: {
      type: Boolean,
      
    },
    otp: { type: Number }
},
    { timestamps: true });

const BrandRegistrationModel = mongoose.model("BrandRegistrationsss", bradRegistrationSchema);
const AdminModel = mongoose.model("AdminRegistration", adminRegistrationSchema);
const DealerModel = mongoose.model("DealerRegistration", dealerRegistrationSchema);
const ServiceModel = mongoose.model("ServiceRegistration", serviceCenterRegistrationSchema);
const TechnicianModal=  mongoose.model("Technician",technicianSchema);
const EmployeeModel = mongoose.model("EmpolyeeRegistration", employeeRegistrationSchema);
const BrandEmployeeModel = mongoose.model("BrandEmpolyeeRegistration", brandEmployeeRegistrationSchema);
const UserModel = mongoose.model("UserRegistration", userRegistrationSchema);

module.exports = {
    BrandRegistrationModel,
    AdminModel,
    ServiceModel,
    TechnicianModal,
    EmployeeModel,
    BrandEmployeeModel,
    DealerModel,
    UserModel
};