const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function rs(v){
  return "Rs." + v.toFixed(2);
}

function generatePDF(bill){

  return new Promise((resolve, reject) => {

    const filePath = path.join(__dirname, "../bills", `bill-${bill.id}.pdf`);
    const doc = new PDFDocument({
    size: [250, 800], // width, height (perfect receipt)
    margin: 20
    });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const center = { align: "center" };

    // ================= HEADER =================
    doc.font("Helvetica-Bold").fontSize(16)
       .text("SMART TROLLEY MART", center);

    doc.moveDown(0.3);

    doc.fontSize(10).font("Helvetica")
       .text("Pune, Maharashtra - 412216", center)
       .text("GSTIN: 27ABCDE1234F1Z5", center)
       .text("Customer Care: +91 9876543210", center);

    doc.moveDown(0.5);
    doc.text("----------------------------------------", center);

    // ================= BILL INFO =================
    doc.moveDown(0.5);

    doc.text(
  "Date & Time: " +
  new Date(bill.time).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata"
  }),
  { align: "center" }
);
    doc.text(`Bill No: ${bill.id}`, center);

    doc.moveDown(0.5);
    doc.text("----------------------------------------", center);

    // ================= CUSTOMER =================
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold")
       .text(`Customer: ${bill.customerName || "Walk-in"}`, center);

    doc.moveDown(0.5);
    doc.text("----------------------------------------", center);

    // ================= TABLE =================
    doc.moveDown(0.5);

    doc.font("Helvetica-Bold");
    doc.text("Item        Qty        Amount", center);

    doc.moveDown(0.3);
    doc.text("----------------------------------------", center);

    doc.font("Helvetica");

    let subtotal = 0;
    let totalQty = 0;

    bill.items.forEach(item => {

      let mrp = item.price;
      let mart = mrp * 0.95;
      let total = mart * item.qty;

      totalQty += item.qty;
      subtotal += total;

      const line = `${item.name.padEnd(10)}   ${item.qty}   ${rs(total)}`;

      doc.text(line, center);
    });

    // ================= TOTAL =================
    let gst = subtotal * 0.05;
    let grandTotal = subtotal + gst;

    doc.moveDown(0.5);
    doc.text("----------------------------------------", center);

    doc.moveDown(0.5);

    doc.text(`Total QTY: ${totalQty}`, center);
    doc.text(`Subtotal: ${rs(subtotal)}`, center);
    doc.text(`GST (5%): ${rs(gst)}`, center);

    doc.moveDown(0.3);
    doc.text("----------------------------------------", center);

    doc.font("Helvetica-Bold").fontSize(12);
    doc.text(`Grand Total: ${rs(grandTotal)}`, center);

    // ================= FOOTER =================
    doc.moveDown(1);

    doc.fontSize(12).font("Helvetica-Bold")
       .text("Thank You!", center);

    doc.moveDown(0.3);

    doc.fontSize(9).font("Helvetica")
       .text("Returns accepted within 7 days with valid bill.", center);

    // ================= END =================
    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);

  });
}

module.exports = { generatePDF };