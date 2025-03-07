
const otpGenerator = require("otp-generator")
const { smsSend, sendMail } = require("../services/service")
const { AdminModel, BrandRegistrationModel, ServiceModel,TechnicianModal, EmployeeModel,BrandEmployeeModel, DealerModel, UserModel } = require('../models/registration');
const NotificationModel = require("../models/notification")


const adminLoginController = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).json({ status: false, msg: "Email and password are required" });
        }

        let user;
        let role;

        // Function to check a model and log the result
        const checkModel = async (model, roleName) => {
            const foundUser = await model.findOne({ email, password });
            if (foundUser) {
                // console.log(`User found in ${roleName} model`);
                user = foundUser;
                role = roleName;
                return true;
            }
            return false;
        };

        // Sequentially check each model
        if (await checkModel(AdminModel, 'ADMIN')) return res.status(200).json({ status: true, msg: "ADMIN login successful", user });
        if (await checkModel(BrandRegistrationModel, 'BRAND')) return res.status(200).json({ status: true, msg: "BRAND login successful", user });
        if (await checkModel(EmployeeModel, 'EMPLOYEE')) return res.status(200).json({ status: true, msg: "EMPLOYEE login successful", user });
        if (await checkModel(BrandEmployeeModel, 'Brand EMPLOYEE')) return res.status(200).json({ status: true, msg: "EMPLOYEE login successful", user });
        if (await checkModel(ServiceModel, 'SERVICE')) return res.status(200).json({ status: true, msg: "SERVICE login successful", user });
        if (await checkModel(TechnicianModal, 'TECHNICIAN')) return res.status(200).json({ status: true, msg: "TECHNICIAN login successful", user });
        if (await checkModel(UserModel, 'USER')) return res.status(200).json({ status: true, msg: "USER login successful", user });
        if (await checkModel(DealerModel, 'DEALER')) return res.status(200).json({ status: true, msg: "DEALER login successful", user });

        // If no user is found
        return res.status(401).json({ status: false, msg: "Incorrect username or password" });
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }
};

module.exports = adminLoginController;



const dashboardLoginController = async (req, res) => {
    try {
        const { userId } = req.body;
 
// console.log(userId);

        // Validate input
        if (!userId) {
            return res.status(400).json({ status: false, msg: "User ID is required" });
        }

        // Check if the user exists in the UserModel
        const user = await UserModel.findOne({ _id:userId });
        // console.log(user);
        if (user) {
            return res.status(200).json({ status: true, msg: "USER login successful", user });
        }

        // If no user is found
        return res.status(401).json({ status: false, msg: "Invalid User ID" });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ status: false, msg: "An error occurred", error: err.message });
    }
};

 


const adminRegistration = async (req, res) => {
    try {
        const { email } = req.body;

        const existingUser = await AdminModel.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ status: false, msg: "Email already registered" });
        }

        // Email does not exist, proceed with registration
        const newData = new AdminModel(req.body);
        await newData.save();
        return res.json({ status: true, msg: "Registration successful" });
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }
};
const brandRegistration = async (req, res) => {
    try {
        const { email, ...otherData } = req.body;

        // Validate input data
        if (!email || !otherData) {
            return res.status(400).json({ status: false, msg: "Bad Request: Missing required fields" });
        }

        // Check for existing email
        const existingBrand = await BrandRegistrationModel.findOne({ email });
        if (existingBrand) {
            return res.status(400).json({ status: false, msg: "Email already registered" });
        }

        // Proceed with registration if the email is unique
        const newData = new BrandRegistrationModel({ email, ...otherData });
        await newData.save();

        return res.json({ status: true, msg: "Registration successful" });
    } catch (err) {
        console.error('Error during registration:', err);
        return res.status(500).json({ status: false, msg: 'Internal Server Error' });
    }
};

const serviceRegistration = async (req, res) => {
    try {
        const { email } = req.body;

        const existingUser = await ServiceModel.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ status: false, msg: "Email already registered" });
        }

        // Email does not exist, proceed with registration
        const newData = new ServiceModel(req.body);
        await newData.save();
        const notification = new NotificationModel({
            serviceCenterId: newData._id,
            userName: newData.serviceCenterName,
            title: `  Service Center  Added `,
            message: ` New Service Center  Added     ${newData.serviceCenterName} !`,
         });
         await notification.save();
        return res.json({ status: true, msg: "Registration successful" });
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }
};
const empolyeeRegistration = async (req, res) => {
    try {
        const { email } = req.body;

        const existingUser = await EmployeeModel.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ status: false, msg: "Email already registered" });
        }

        // Email does not exist, proceed with registration
        const newData = new EmployeeModel(req.body);
        await newData.save();
        return res.json({ status: true, msg: "Registration successful" });
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }
};
const dealerRegistration = async (req, res) => {
    try {
        const { email } = req.body;

        const existingUser = await DealerModel.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ status: false, msg: "Email already registered" });
        }

        // Email does not exist, proceed with registration
        const newData = new DealerModel(req.body);
        await newData.save();
        const notification = new NotificationModel({
            dealerId: newData._id,
            userName: newData.name,
            title: `  Dealer  Added `,
            message: ` New Dealer  Added     ${newData.name} !`,
         });
         await notification.save();
        return res.json({ status: true, msg: "Registration successful" });
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }
};
const getAllBrand = async (req, res) => {
    try {
        const data = await BrandRegistrationModel.find({}).sort({ _id: -1 });
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}
const userRegistration = async (req, res) => {
    try {
        const { email } = req.body;

        const existingUser = await UserModel.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ status: false, msg: "Email already registered" });
        }


        const newData = new UserModel(req.body);
        await newData.save();
        const notification = new NotificationModel({
            userId: newData._id,
            userName: newData.name,
            title: `  User  Added `,
            message: ` New User  Added     ${newData.name} !`,
         });
         await notification.save();
        return res.json({ status: true, msg: "Registration successful" });
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }
};
const getBrandById = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await BrandRegistrationModel.findById(_id);
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}

const editBrand = async (req, res) => {
    try {
        let _id = req.params.id;
        let body = req.body;
        let data = await BrandRegistrationModel.findByIdAndUpdate(_id, body);
        if(body.status){
            const notification = new NotificationModel({
                brandId: newData.brandID,
                userName: newData.brandName,
                title: `   Verification    `,
                message: `   Brand  Verified     ${newData.brandName} !`,
             });
             await notification.save();
        }
        res.json({ status: true, msg: "Brand Updated" });
    } catch (err) {
        res.status(500).send(err);
    }
}
const updateBrandTerms = async (req, res) => {
    const { warrantyCondition } = req.body;
    try {
    // Validate the input
    if (!warrantyCondition) {
      return res.status(400).json({ message: "Warranty Condition is required" });
    }

    // Update the brand in the database
    const updatedBrand = await BrandRegistrationModel.findByIdAndUpdate(
      req.params.id, // The brand ID
      { warrantyCondition }, // Fields to update
      { new: true, runValidators: true } // Return the updated document
    );

    if (!updatedBrand) {
      return res.status(404).json({ status: false, msg: "Brand not found" });
    }

    res.status(200).json({
        status: true, msg: "Brand Terms & conditions updated successfully",
       
    });
  } catch (error) {
    console.error("Error updating brand:", error);
    res.status(500).json({ status: false, msg: "Internal server error" });
  }
}
const deleteBrand = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await BrandRegistrationModel.findByIdAndDelete(_id);
        res.json({ status: true, msg: "Brand Deteled" });
    } catch (err) {
        res.status(500).send(err);
    }
}
const getAllServiceCenter = async (req, res) => {
    try {
        const data = await ServiceModel.find({}).sort({ _id: -1 });
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}
const getServiceCenterById = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await ServiceModel.findById(_id);
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}

const editServiceCenter = async (req, res) => {
    try {
        let _id = req.params.id;
        let body = req.body;
        let data = await ServiceModel.findByIdAndUpdate(_id, body);
        if(body.status){
            const notification = new NotificationModel({
                serviceCenterId: newData._id,
                userName: newData.serviceCenterName,
                title: `  Service Center  Verification `,
                message: `   Service Center  Verified     ${newData.serviceCenterName} !`,
             });
             await notification.save();
        }
        res.json({ status: true, msg: "ServiceCenter Updated" });
    } catch (err) {
        res.status(500).send(err);
    }
}
const deleteServiceCenter = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await ServiceModel.findByIdAndDelete(_id);
        res.json({ status: true, msg: "ServiceCenter Deteled" });
    } catch (err) {
        res.status(500).send(err);
    }
}
const getAllEmployee = async (req, res) => {
    try {
        const data = await EmployeeModel.find({}).sort({ _id: -1 });
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}
const getEmployeeById = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await EmployeeModel.findById(_id);
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}

const editEmployee = async (req, res) => {
    try {
        let _id = req.params.id;
        let body = req.body;
        let data = await EmployeeModel.findByIdAndUpdate(_id, body);
        res.json({ status: true, msg: "Employee Updated" });
    } catch (err) {
        res.status(500).send(err);
    }
}
const deleteEmployee = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await EmployeeModel.findByIdAndDelete(_id);
        res.json({ status: true, msg: "Employee Deteled" });
    } catch (err) {
        res.status(500).send(err);
    }
}
const brandEmpolyeeRegistration = async (req, res) => {
    try {
        const { email } = req.body;

        const existingUser = await BrandEmployeeModel.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ status: false, msg: "Email already registered" });
        }

        // Email does not exist, proceed with registration
        const newData = new BrandEmployeeModel(req.body);
        await newData.save();
        return res.json({ status: true, msg: "Registration successful" });
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }
};
const getAllBrandEmployee = async (req, res) => {
    try {
        const data = await BrandEmployeeModel.find({}).sort({ _id: -1 });
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}
const getBrandEmployeeById = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await BrandEmployeeModel.findById(_id);
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}

const editBrandEmployee = async (req, res) => {
    try {
        let _id = req.params.id;
        let body = req.body;
        let data = await BrandEmployeeModel.findByIdAndUpdate(_id, body);
        res.json({ status: true, msg: "Brand Employee Updated" });
    } catch (err) {
        res.status(500).send(err);
    }
}
const deleteBrandEmployee = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await BrandEmployeeModel.findByIdAndDelete(_id);
        res.json({ status: true, msg: "Brand Employee Deteled" });
    } catch (err) {
        res.status(500).send(err);
    }
}

const getAllUser = async (req, res) => {
    try {
        const data = await UserModel.find({}).sort({ _id: -1 });
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}
const getUserById = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await UserModel.findById(_id);
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}

const editUser = async (req, res) => {
    try {
        let _id = req.params.id;
        let body = req.body;
        let data = await UserModel.findByIdAndUpdate(_id, body);
        if(body.status){
            const notification = new NotificationModel({
                userId: newData._id,
                userName: newData.name,
                title: `  User  Verification `,
                message: `   User  Verified     ${newData.name} !`,
             });
        }
        res.json({ status: true, msg: "User Updated" });
    } catch (err) {
        res.status(500).send(err);
    }
}
const deleteUser = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await UserModel.findByIdAndDelete(_id);
        res.json({ status: true, msg: "User Deteled" });
    } catch (err) {
        res.status(500).send(err);
    }
}
const getAllDealer = async (req, res) => {
    try {
        const data = await DealerModel.find({}).sort({ _id: -1 });
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}
const getDealerById = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await DealerModel.findById(_id);
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}

const editDealer = async (req, res) => {
    try {
        let _id = req.params.id;
        let body = req.body;
        let data = await DealerModel.findByIdAndUpdate(_id, body);
        if(body.status){
            const notification = new NotificationModel({
                userId: newData._id,
                userName: newData.name,
                title: `  Dealer  Verification `,
                message: `   Dealer  Verified     ${newData.name} !`,
             });
             await notification.save();
        }
        res.json({ status: true, msg: "Dealer Updated" });
    } catch (err) {
        res.status(500).send(err);
    }
}
const deleteDealer = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await DealerModel.findByIdAndDelete(_id);
        res.json({ status: true, msg: "Dealer Deteled" });
    } catch (err) {
        res.status(500).send(err);
    }
}

const getProfileById = async (req, res) => {
    try {
      let _id = req.params.id;
  
      // Fetch data from all models concurrently
      const [serviceData, brandData,dealerData,technicianData, userData,empData] = await Promise.all([
        ServiceModel.findById(_id),
        BrandRegistrationModel.findById(_id),
        UserModel.findById(_id),
        TechnicianModal.findById(_id),
        DealerModel.findById(_id),
        EmployeeModel.findById(_id),
      ]);
  
      // Combine the data into a single response
      const combinedData = {
        service: serviceData,
        brand: brandData,
        user: userData,
        dealer: dealerData,
        technician: technicianData,
        emp:empData,
      };
  
      res.send(combinedData);
    } catch (err) {
      res.status(400).send(err);
    }
  };
  
  const getUserServerById = async (req, res) => {
    try {
        let _id = req.params.id;

        // Check if email and password are provided
        if (!_id) {
            return res.status(400).json({ status: false, msg: "Id is required" });
        }

        let user;
        let role;

        // Function to check a model and log the result
        const checkModel = async (model, roleName) => {
            const foundUser = await model.findOne({ _id });
            if (foundUser) {
                // console.log(`User found in ${roleName} model`);
                user = foundUser;
                role = roleName;
                return true;
            }
            return false;
        };

        // Sequentially check each model
        if (await checkModel(AdminModel, 'ADMIN')) return res.status(200).json({ status: true, msg: "ADMIN login successful", user });
        if (await checkModel(BrandRegistrationModel, 'BRAND')) return res.status(200).json({ status: true, msg: "BRAND login successful", user });
        if (await checkModel(EmployeeModel, 'EMPLOYEE')) return res.status(200).json({ status: true, msg: "EMPLOYEE login successful", user });
        if (await checkModel(BrandEmployeeModel, 'EMPLOYEE')) return res.status(200).json({ status: true, msg: "Brand EMPLOYEE login successful", user });
        if (await checkModel(ServiceModel, 'SERVICE')) return res.status(200).json({ status: true, msg: "SERVICE login successful", user });
        if (await checkModel(TechnicianModal, 'TECHNICIAN')) return res.status(200).json({ status: true, msg: "TECHNICIAN login successful", user });
        if (await checkModel(UserModel, 'USER')) return res.status(200).json({ status: true, msg: "USER login successful", user });
        if (await checkModel(DealerModel, 'DEALER')) return res.status(200).json({ status: true, msg: "DEALER login successful", user });

        // If no user is found
        return res.status(401).json({ status: false, msg: "Incorrect user _id" });
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }
  }; 
  

const otpSending = async (req, res) => {
    try {
        let body = req.body;
        let otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
        let user = await UserModel.findOneAndUpdate({ email: body.email }, { otp: otp });
        if (user) {
            smsSend(otp, user.contact);
            res.json({ status: true, msg: "OTP sent" });
        } else {
            res.json({ status: false, msg: "Something went wrong!" });
        }
    } catch (err) {
        res.status(400).send(err);
    }
}
const otpVerificationSending = async (req, res) => {
    try {
        let body = req.body;
        // console.log(body);
        let otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
        let filter = {};

        if (body.contact) {
            filter = { contact: body.contact };
        } else if (body.email) {
            filter = { email: body.email };
        } else {
            return res.status(400).json({ status: false, msg: "Invalid request" });
        }
        // console.log(filter);
        let user = await UserModel.findOneAndUpdate(filter, { otp: otp });
        // console.log(user);
        if (user) {
            if (body.contact) {
                smsSend(otp, user.contact);
            } else if (body.email) {

                sendMail( body.email, otp,);
            }
            // console.log(user);
            // smsSend(otp, user.contact);
            return res.json({ status: true, msg: "OTP sent" });
        } else {
            return res.json({ status: false, msg: "User not found" });
        }
    } catch (err) {
        return res.status(400).send(err);
    }
}

const otpVerification = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await UserModel.findOne({ email, otp });
        if (user) {
            res.json({ status: true, msg: "Verified" });
        } else {
            res.status(400).json({ status: false, msg: "Incorrect OTP" });
        }
    } catch (err) {
        res.status(500).send(err);
    }
}

// const mobileEmailVerification = async (req, res) => {
//     try {
//         const { email, contact, otp } = req.body;

//         // Find the user by email or contact and OTP
//         const user = await UserModel.findOne({ $or: [{ email }, { contact }], otp });

//         if (user) {
//             // Update the user's verification status if email is provided
//             if (email) {
//                 const verify = await UserModel.findByIdAndUpdate(
//                     user._id,
//                     { verification: 'VERIFIED' },
//                     { new: true }
//                 );
//                 return res.json({ status: true, msg: "Verified" });
//             }
//             // If contact is provided, return a different response
//             return res.json({ status: true, msg: "Verified" });
//         } else {
//             return res.status(400).json({ status: false, msg: "Incorrect OTP" });
//         }
//     } catch (err) {
//         return res.status(500).send(err);
//     }
// };

const verifyEntity = async (model, email, contact, otp) => {
    return model.findOne({ $or: [{ email }, { contact }], otp });
};

const updateVerificationStatus = async (model, id) => {
    return model.findByIdAndUpdate(id, { verification: 'VERIFIED' }, { new: true });
};

const mobileEmailVerification = async (req, res) => {
    try {
        const { email, contact, otp } = req.body;

        // Find the user in all models
        const [user, brand, serviceCenter] = await Promise.all([
            verifyEntity(UserModel, email, contact, otp),
            verifyEntity(BrandRegistrationModel, email, contact, otp),
            verifyEntity(ServiceModel, email, contact, otp)
        ]);

        const entity = user || brand || serviceCenter;

        if (entity) {
            // Update verification status
            await updateVerificationStatus(entity.constructor, entity._id);

            return res.json({ status: true, msg: "Verified" });
        } else {
            return res.status(400).json({ status: false, msg: "Incorrect OTP" });
        }
    } catch (err) {
        return res.status(500).send(err);
    }
};

// const mobileEmailVerification = async (req, res) => {
//     try {
//         const { email, contact, otp } = req.body;

//         // Find the user by email or contact and OTP
//         const user = await UserModel.findOne({ $or: [{ email }, { contact }], otp });

//         if (user) {
//             // Update the user's verification status
//            if(email){

//            const verify = await UserModel.findByIdAndUpdate(
//                 user._id,
//                 { verification: 'VERIFIED' },
//                 { new: true }
//             );
//             res.json({ status: true, msg: "Verified" });
//         }

//             res.json({ status: true, msg: "Verified" });
//         } else {
//             res.status(400).json({ status: false, msg: "Incorrect OTP" });
//         }
//     } catch (err) {
//         res.status(500).send(err);
//     }
// };

//   const forgetPassword=async (req, res) => {
//     try {
//         let body = req.body;
//         let bool = true;
//         let user = await UserModel.findOneAndUpdate({ email: body.email }, { password: body.password });
//         if (user) {
//             res.json({ status: true, msg: "Password changed successfully!" });
//              sendMail(body.email,body.password,bool);
//         } else {
//             res.json({ status: false, msg: "Something went wrong!" });
//         }
//     } catch (err) {
//         res.status(500).send(err);
//     }
//   }

const forgetPassword = async (req, res) => {
    try {
        const { email, password } = req.body;
        let user;
        let bool = true;

        const updateOptions = { email: email, password: password };
        const findAndUpdate = async (Model) => {
            return await Model.findOneAndUpdate({ email }, { password }, { new: true });
        };

        // Check in each model
        const models = [
            UserModel,
            AdminModel,
            BrandRegistrationModel,
            EmployeeModel,
            ServiceModel,
            DealerModel
        ];

        for (const Model of models) {
            user = await findAndUpdate(Model);
            if (user) break;
        }

        if (user) {
            //    sendMail(body.email,body.password,bool);
            res.json({ status: true, msg: "Password changed successfully!" });
        } else {
            res.json({ status: false, msg: "Email not found in any model!" });
        }
    } catch (err) {
        console.error("Error in forgetPassword:", err);
        res.status(500).send({ status: false, msg: "Internal server error", error: err });
    }
};



module.exports = {
    getProfileById,getUserServerById,adminLoginController,dashboardLoginController, brandRegistration, serviceRegistration, empolyeeRegistration, dealerRegistration, adminRegistration, userRegistration,
    getAllBrand, getBrandById,updateBrandTerms, editBrand, deleteBrand, getAllServiceCenter, getServiceCenterById, editServiceCenter, deleteServiceCenter,
    getAllEmployee, getEmployeeById, editEmployee, deleteEmployee, getAllUser, getUserById, editUser, deleteUser,
    brandEmpolyeeRegistration,getAllBrandEmployee,getBrandEmployeeById,editBrandEmployee,deleteBrandEmployee,
     getAllDealer, getDealerById, editDealer, deleteDealer, otpVerification, otpVerificationSending, mobileEmailVerification, forgetPassword, otpSending
};
