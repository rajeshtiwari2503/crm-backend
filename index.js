// const express = require("express");
// require("./src/db/connection");
// require("dotenv").config();
// const cors = require("cors");
// const app = express();
// const registration = require("./src/routers/registration");
// const product = require("./src/routers/product");
// const productWarranty = require("./src/routers/productWarranty");
// const productCategory = require("./src/routers/productCategory");
// const subCategory = require("./src/routers/subCategory");
// const complaintNature = require("./src/routers/complaintNature");
// const sparePart = require("./src/routers/sparePart");
// const complaint = require("./src/routers/complaint");
// const bulkUploadComplaint = require("./src/routers/bulkUploadComplaint");
// const location = require("./src/routers/location");
// const feedback = require("./src/routers/feedback");
// const notification = require("./src/routers/notification");
// const technician = require("./src/routers/technician");
// const order = require("./src/routers/order");
// const stock = require("./src/routers/stock");
// const dashboard = require("./src/routers/dashboard");
// const filterData = require("./src/routers/filterData");
// const bank = require("./src/routers/bank");
// const walletTransaction = require("./src/routers/bank");
// const chatTicket = require("./src/routers/chatTicket");
// const wallet = require("./src/routers/wallet");
// const payment = require("./src/routers/payments");
// const shipyariOrder=require("./src/routers/shipyariOrder")

// app.use(express.json());
// app.use(cors());
// app.use(cors({
//     origin: '*', // Allow all origins
//     methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed methods
//     allowedHeaders: ['Content-Type', 'Authorization'] // Specify allowed headers
//   }));
// app.use(function (req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header(
//         "Access-Control-Allow-Methods",
//         "GET, POST, OPTIONS, PUT, PATCH, DELETE, HEAD"
//     );
//     res.header(
//         "Access-Control-Allow-Headers",
//         "Origin, X-Requested-With, Content-Type, Accept"
//     );
//     next();
// });
// const PORT = process.env.PORT || 5000;

// app.get("/",(req,res)=>{
//     res.json( "Server is running")
// })

// app.use(registration);
// app.use(technician);
// app.use(product);
// app.use(productWarranty);
// app.use(productCategory);
// app.use(subCategory);
// app.use(complaintNature);
// app.use(sparePart);
// app.use(complaint);
// app.use(bulkUploadComplaint);
// app.use(location);
// app.use(feedback);
// app.use(notification);
// app.use(stock);
// app.use(order);
// app.use(dashboard);
// app.use(filterData);
// app.use(chatTicket);
// app.use(bank);
// app.use(walletTransaction);
// app.use(wallet);
// app.use(payment);
// app.use(shipyariOrder);

// app.listen(5000, () => {
//     console.log("Server is running on PORT", PORT);
// });
const express = require("express");
require("./src/db/connection");
require("dotenv").config();
require("./src/cronJob");
const cors = require("cors");
const app = express();
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

app.use(express.json());
 
// app.use(cors({
//     origin: '*',
//     methods: ['GET', 'POST','PATCH', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));

// // Handle OPTIONS requests globally
// app.options('*', (req, res) => {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
//     res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
//     res.sendStatus(204); // No content, but successfully handled
// });

// app.use(function (req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header(
//         "Access-Control-Allow-Methods",
//         "GET, POST, OPTIONS, PUT, PATCH, DELETE, HEAD"
//     );
//     res.header(
//         "Access-Control-Allow-Headers",
//         "Origin, X-Requested-With, Content-Type, Accept"
//     );
//     next();
// });

// const corsOptions = {
//     origin: '*', // Replace '*' with specific domains for security
//     methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'Referer', 'Origin', 'X-Requested-With', 'Accept'],
//     preflightContinue: false,
//     optionsSuccessStatus: 204
// };
// app.use(cors(corsOptions));



// // Handle OPTIONS preflight requests
// app.options('*', cors(corsOptions));

// // Example Referrer-Policy header
// app.use((req, res, next) => {
//     res.header("Referrer-Policy", "strict-origin-when-cross-origin");
//     next();
// });


 
app.use(cors());

app.use(function (req, res, next){
    res.header("Access-Control-Allow-Origin","*");
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

app.listen(PORT, () => {
    console.log("Server is running on PORT", PORT);
});
