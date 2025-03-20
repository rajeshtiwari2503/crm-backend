const {TechnicianModal} = require("../models/registration")
 
const NotificationModel = require("../models/notification")

const addTechnician = async (req, res) => {

    try {
        let body = req.body;
        const { email } = req.body;
        const existingTech = await TechnicianModal.findOne({ email });

        if (existingTech) {
            return res.status(400).json({ status: false, msg: "Email already registered" });
        }

        let data=new TechnicianModal(body);
        await data.save();
        const notification = new NotificationModel({
            userId: data.userId,
            technicianId: data?._id,
            serviceCenterId: data.serviceId,
            brandId: data.brandId,
            dealerId: data.dealerId,
            userName: data.name,
            title: ` Technician  Added `,
            message: ` Service Center add  Technician    ${data.name} !`,
         });
         await notification.save();
        res.json({ status: true, msg: "Technician   Added" });
    } catch (err) {
        res.status(400).send(err);
    }

};

const getAllTechnician = async (req, res) => {
    try {
        let data = await TechnicianModal.find({}).sort({ _id: -1 });
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}
const getTechnicianById = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await TechnicianModal.findById(_id);
        res.send(data);
    } catch (err) {
        res.status(400).send(err);
    }
}
const getComplaintByCenterId = async (req, res) => {
    try {
      const serviceCenterId = req.params.userId;
      const data = await TechnicianModal.find({ serviceCenterId }).populate('serviceCenterId');
      res.send(data);
    } catch (err) {
      res.status(400).send(err);
    }
  };
const editTechnician = async (req, res) => {
    try {
        let _id = req.params.id;
        let body = req.body;
        let data = await TechnicianModal.findByIdAndUpdate(_id, body);
        if(body.status){
            const notification = new NotificationModel({
                userId: data.userId,
                technicianId: data?._id,
                serviceCenterId: data.serviceId,
                brandId: data.brandId,
                dealerId: data.dealerId,
                userName: data.name,
                title: ` Technician   Verified `,
                message: `Technician  Verified  ${data.name} !`,
             });
             await notification.save();
        }
        
        res.json({ status: true, msg: "Technician Updated" });
    } catch (err) {
        res.status(500).send(err);
    }
}
const deleteTechnician = async (req, res) => {
    try {
        let _id = req.params.id;
        let data = await TechnicianModal.findByIdAndDelete(_id);
        res.json({ status: true, msg: "Technician Deteled" });
    } catch (err) {
        res.status(500).send(err);
    }
}

module.exports = { addTechnician,getComplaintByCenterId, getAllTechnician, getTechnicianById, editTechnician, deleteTechnician };
