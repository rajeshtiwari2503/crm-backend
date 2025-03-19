const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const moment = require('moment');
const ComplaintModal = require("../models/complaint");

// Ensure the uploads directory exists
// const uploadDir = path.join(__dirname, 'uploads');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
// }
const uploadDir = "/tmp";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });


 

router.post('/bulkServiceRequests', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: false, msg: 'No file uploaded.' });
  }

  const filePath = req.file.path;

  try {
    const { brandId, productBrand } = req.body; // Get brandId & productBrand from request body
  
  
    //   close create service
  //   if(brandId==="67ab1ec2bfe41718e6ddfb6e"){
  //     console.log("brandId",brandId);
      
  //     return res.status(404).json({ status: false, msg: 'Complaint not added' });
  //  }


    if (!brandId || !productBrand) {
      return res.status(400).json({ status: false, msg: 'Brand ID and Product Brand are required.' });
    }

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Read data as JSON (avoid formatted copy-paste issues)
    const results = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });

    // Expected Headers
    const expectedHeaders = [
      "complaintId", "productName", "categoryName", "brandId", "productBrand",
      "modelNo", "serialNo", "purchaseDate", "warrantyStatus", "issueType",
      "detailedDescription", "preferredServiceDate", "preferredServiceTime",
      "serviceLocation", "serviceAddress", "pincode", "district", "state",
      "fullName", "emailAddress", "phoneNumber"
    ];

    // Normalize headers from the Excel file (trim spaces, lowercase)
    const uploadedHeaders = results[0].map(header => header.trim().toLowerCase());
    const expectedHeadersLower = expectedHeaders.map(header => header.toLowerCase());

    // Validate headers
    const isValidHeaders = expectedHeadersLower.every(header => uploadedHeaders.includes(header));
    if (!isValidHeaders) {
      return res.status(400).json({ status: false, msg: 'Invalid file format. Ensure correct column headers.' });
    }

    // Process data rows (Skipping header row)
    const mappedResults = results.slice(1).map(row => {
      let rowData = {};
      expectedHeaders.forEach((header, index) => {
        let cellValue = row[index] ? row[index].toString().trim() : null; // Trim unnecessary spaces

        // Handle Date Formatting
        if (["purchaseDate", "preferredServiceDate"].includes(header)) {
          cellValue = cellValue ? moment(cellValue, ["MM-DD-YYYY", "YYYY-MM-DD", "DD-MM-YYYY"]).toDate() : null;
        }

        rowData[header] = cellValue;
      });

      // Ensure brandId and productBrand are always set
      rowData.brandId = brandId;
      rowData.productBrand = productBrand;

      return rowData;
    });

    // Insert into MongoDB
    await ComplaintModal.insertMany(mappedResults);

    res.json({ status: true, msg: 'Excel data successfully uploaded and saved to database!' });
  } catch (error) {
    console.error('Error processing the file:', error);
    res.status(500).json({ status: false, msg: 'Error processing the file.' });
  } finally {
    // Delete the uploaded file to save space
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Error deleting the file:', err);
    }
  }
});

 

module.exports = router;



// const express = require('express');
// const multer = require('multer');
// const xlsx = require('xlsx');
// const fs = require('fs');
// const moment = require('moment');
// const ComplaintModal = require("../models/complaint") // Import your Complaint model

// const router = express.Router();
// const upload = multer({ dest: 'uploads/' }); // Adjust your file upload config as needed

// // Function to generate a unique complaintId
// const generateComplaintId = async (complaint) => {
//   let unique = false;
//   let newComplaintId;

//   while (!unique) {
//     const brandPart = complaint.productBrand ? complaint.productBrand.slice(0, 2).toUpperCase() : "XX";
//     const date = new Date();
//     const dayPart = date.getDate().toString().padStart(2, '0');
//     const monthPart = (date.getMonth() + 1).toString().padStart(2, '0');
//     const productPart = complaint.productName ? complaint.productName.slice(0, 2).toUpperCase() : "YY";
//     const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

//     newComplaintId = `${brandPart}${dayPart}${monthPart}${productPart}${randomPart}`;

//     // Ensure uniqueness
//     const existingComplaint = await ComplaintModal.findOne({ complaintId: newComplaintId });
//     if (!existingComplaint) {
//       unique = true;
//     }
//   }

//   return newComplaintId;
// };

// // Bulk Upload Route
// router.post('/bulkServiceRequests', upload.single('file'), async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ status: false, msg: 'No file uploaded.' });
//   }

//   const filePath = req.file.path;

//   try {
//     const { brandId, productBrand } = req.body;

//     if (!brandId || !productBrand) {
//       return res.status(400).json({ status: false, msg: 'Brand ID and Product Brand are required.' });
//     }

//     const workbook = xlsx.readFile(filePath);
//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];
//     const results = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });

//     const expectedHeaders = [
//       "complaintId", "productName", "categoryName", "brandId", "productBrand",
//       "modelNo", "serialNo", "purchaseDate", "warrantyStatus", "issueType",
//       "detailedDescription", "preferredServiceDate", "preferredServiceTime",
//       "serviceLocation", "serviceAddress", "pincode", "district", "state",
//       "fullName", "emailAddress", "phoneNumber"
//     ];

//     const uploadedHeaders = results[0].map(header => header.trim().toLowerCase());
//     const expectedHeadersLower = expectedHeaders.map(header => header.toLowerCase());

//     const isValidHeaders = expectedHeadersLower.every(header => uploadedHeaders.includes(header));
//     if (!isValidHeaders) {
//       return res.status(400).json({ status: false, msg: 'Invalid file format. Ensure correct column headers.' });
//     }

//     const mappedResults = await Promise.all(results.slice(1).map(async (row) => {
//       let rowData = {};
//       expectedHeaders.forEach((header, index) => {
//         let cellValue = row[index] ? row[index].toString().trim() : null;

//         if (["purchaseDate", "preferredServiceDate"].includes(header)) {
//           cellValue = cellValue ? moment(cellValue, ["MM-DD-YYYY", "YYYY-MM-DD", "DD-MM-YYYY"]).toDate() : null;
//         }

//         rowData[header] = cellValue;
//       });

//       rowData.brandId = brandId;
//       rowData.productBrand = productBrand;

//       // Generate and assign a unique complaintId
//       rowData.complaintId = await generateComplaintId(rowData);

//       return rowData;
//     }));

//     await ComplaintModal.insertMany(mappedResults);

//     res.json({ status: true, msg: 'Excel data successfully uploaded and saved to database!' });
//   } catch (error) {
//     console.error('Error processing the file:', error);
//     res.status(500).json({ status: false, msg: 'Error processing the file.' });
//   } finally {
//     try {
//       fs.unlinkSync(filePath);
//     } catch (err) {
//       console.error('Error deleting the file:', err);
//     }
//   }
// });

// module.exports = router;
