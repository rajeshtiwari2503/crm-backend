//  // src/utils/excelHelper.js
// const ExcelJS = require("exceljs");

// async function generatePendingComplaintsExcel(data, filePath) {
//   const workbook = new ExcelJS.Workbook();
//   const worksheet = workbook.addWorksheet("Pending Complaints");

//   worksheet.columns = [
//     { header: "Complaint ID", key: "complaintId", width: 20 },
//     { header: "Customer Name", key: "customerName", width: 25 },
//     { header: "Product", key: "product", width: 25 },
//     { header: "Status", key: "status", width: 15 },
//     { header: "Assigned To", key: "assignedTo", width: 25 },
//     { header: "Created At", key: "createdAt", width: 25 },
//   ];

//   data.forEach((item) => {
//     worksheet.addRow(item);
//   });

//   await workbook.xlsx.writeFile(filePath);
// }

// module.exports = { generatePendingComplaintsExcel };


const ExcelJS = require("exceljs");

async function generatePendingComplaintsExcel(data, filePath) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Pending Complaints");

  worksheet.columns = [
    { header: "Complaint ID", key: "complaintId", width: 20 },
    { header: "Customer Name", key: "customerName", width: 25 },
    { header: "Product", key: "product", width: 25 },
    { header: "Status", key: "status", width: 15 },
    { header: "Assigned To", key: "assignedTo", width: 25 },
    { header: "Created At", key: "createdAt", width: 25 },
  ];

  // 🔹 Log the incoming data
//   console.log("Pending complaints data:", JSON.stringify(data, null, 2));

  data.forEach((item, i) => {
    // console.log(`Adding row #${i + 1}:`, item); // log each row separately
    worksheet.addRow(item);
  });

  await workbook.xlsx.writeFile(filePath);
//   console.log(`✅ Excel file saved at: ${filePath}`);
}

module.exports = { generatePendingComplaintsExcel };

