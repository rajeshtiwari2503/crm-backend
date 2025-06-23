
const express = require("express");
require("./src/db/connection");
require("dotenv").config();
require("./src/cronJob");
const cors = require("cors");
 
const { app, server } = require("./src/socketIO/server");


const registration = require("./src/routers/registration");
const product = require("./src/routers/product");
const productWarranty = require("./src/routers/productWarranty");
const productCategory = require("./src/routers/productCategory");
const subCategory = require("./src/routers/subCategory");
const complaintNature = require("./src/routers/complaintNature");
const sparePart = require("./src/routers/sparePart");
const complaint = require("./src/routers/complaint");
const bulkUploadComplaint = require("./src/routers/bulkUploadComplaint");
const location = require("./src/routers/location");
const feedback = require("./src/routers/feedback");
const notification = require("./src/routers/notification");
const technician = require("./src/routers/technician");
const order = require("./src/routers/order");
const stock = require("./src/routers/stock");
const dashboard = require("./src/routers/dashboard");
const filterData = require("./src/routers/filterData");
const bank = require("./src/routers/bank");
const walletTransaction = require("./src/routers/bank");
const chatTicket = require("./src/routers/chatTicket");
const wallet = require("./src/routers/wallet");
const payment = require("./src/routers/payments");
const shipyariOrder = require("./src/routers/shipyariOrder");
const brandRecharge = require("./src/routers/brandRecharge");

const serviceCenterDeposit = require("./src/routers/serviceCenterDeposit");
const serviceCenterPayment = require("./src/routers/servicePayment");
const serviceRequest = require("./src/routers/serviceRequest");
const empAttendance = require("./src/routers/attendanceRouter");

app.use(express.json());

 
app.use(cors());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE, HEAD"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

 

app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));



const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.json("Server is running");
});


app.use(registration);
app.use(technician);
app.use(product);
app.use(productWarranty);
app.use(productCategory);
app.use(subCategory);
app.use(complaintNature);
app.use(sparePart);
app.use(complaint);
app.use(bulkUploadComplaint);
app.use(location);
app.use(feedback);
app.use(notification);
app.use(stock);
app.use(order);
app.use(dashboard);
app.use(filterData);
app.use(chatTicket);
app.use(bank);
app.use(walletTransaction);
app.use(wallet);
app.use(payment);
app.use(shipyariOrder);
app.use(brandRecharge);
app.use(serviceCenterDeposit);
app.use(serviceCenterPayment);
app.use(serviceRequest);
app.use(empAttendance);

 

const onlineServer=server.listen(PORT, () => {
  console.log("Server is running on PORT", PORT);
});



//  const io=require('socket.io')(server,{
//   pingTimeout:60000,
//   cors:{
//     origin:"http://localhost:3000",
//      methods: ['GET', 'POST'],
//   },
//  })

// app.set('socketio', io);


// io.on("connection", (socket) => {
//   console.log("Client connected:", socket.id);

//   socket.on("disconnect", () => {
//     console.log("Client disconnected:", socket.id);
//   });
// });