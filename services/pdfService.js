const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// ================= MONEY FORMAT =================

function rs(value) {
  return "Rs. " + Number(value || 0).toFixed(2);
}

// ================= DIVIDER =================

function drawLine(doc, y) {
  doc
    .moveTo(20, y)
    .lineTo(230, y)
    .strokeColor("#D1D1D6")
    .lineWidth(0.7)
    .stroke();
}

// ================= PDF GENERATOR =================

function generatePDF(bill) {
  return new Promise((resolve, reject) => {

    const filePath = path.join(
      __dirname,
      "../bills",
      `bill-${bill.id}.pdf`
    );

    const doc = new PDFDocument({
      size: [250, 800],
      margin: 20
    });

    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    const center = { align: "center" };

    const left = 20;
    const right = 230;

    // =================================================
    // HEADER
    // =================================================

    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor("#111111")
      .text("SMART", center);

    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#555555")
      .text("TROLLEY", center);

    doc.moveDown(0.25);

    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor("#8E8E93")
      .text("SMART SHOPPING, SIMPLIFIED", center);

    doc.moveDown(0.8);

    drawLine(doc, doc.y);

    // =================================================
    // BILL DETAILS
    // =================================================

    doc.moveDown(0.7);

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor("#111111")
      .text("BILL DETAILS");

    doc.moveDown(0.6);

    const date = new Date(bill.time).toLocaleString(
      "en-IN",
      {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short"
      }
    );

    function detailRow(label, value) {
      const y = doc.y;

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#8E8E93")
        .text(label, left, y);

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor("#111111")
        .text(
          value,
          90,
          y,
          {
            width: 140,
            align: "right"
          }
        );

      doc.moveDown(0.55);
    }

    detailRow("Bill No.", `#${bill.id}`);
    detailRow("Date & Time", date);
    detailRow(
      "Customer",
      bill.customerName || "Walk-in Customer"
    );

    drawLine(doc, doc.y);

    // =================================================
    // ITEMS
    // =================================================

    doc.moveDown(0.8);

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor("#111111")
      .text("SHOPPING SUMMARY");

    doc.moveDown(0.7);

    // Table Header

    const tableY = doc.y;

    doc
      .font("Helvetica-Bold")
      .fontSize(7)
      .fillColor("#8E8E93")
      .text("ITEM", left, tableY);

    doc.text(
      "QTY",
      132,
      tableY,
      {
        width: 30,
        align: "center"
      }
    );

    doc.text(
      "AMOUNT",
      165,
      tableY,
      {
        width: 65,
        align: "right"
      }
    );

    doc.moveDown(0.6);

    drawLine(doc, doc.y);

    doc.moveDown(0.6);

    let subtotal = 0;
    let totalQty = 0;

    bill.items.forEach((item) => {

      const mrp = Number(item.price || 0);

      // =============================================
      // EXISTING SMART TROLLEY CALCULATION
      // MRP → 5% Discount
      // =============================================

      const smartPrice = mrp * 0.95;

      const qty = Number(item.qty || 0);

      const itemTotal = smartPrice * qty;

      subtotal += itemTotal;
      totalQty += qty;

      const y = doc.y;

      // Product Name

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor("#111111")
        .text(
          item.name || "Product",
          left,
          y,
          {
            width: 105
          }
        );

      // Product price

      doc
        .font("Helvetica")
        .fontSize(6.5)
        .fillColor("#8E8E93")
        .text(
          `${rs(smartPrice)} each`,
          left,
          doc.y + 2,
          {
            width: 105
          }
        );

      // Quantity

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#555555")
        .text(
          qty.toString(),
          132,
          y,
          {
            width: 30,
            align: "center"
          }
        );

      // Total

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor("#111111")
        .text(
          rs(itemTotal),
          165,
          y,
          {
            width: 65,
            align: "right"
          }
        );

      doc.moveDown(1.2);
    });

    // =================================================
    // PAYMENT SUMMARY
    // =================================================

    drawLine(doc, doc.y);

    doc.moveDown(0.8);

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor("#111111")
      .text("PAYMENT SUMMARY");

    doc.moveDown(0.7);

    // =============================================
    // EXISTING CALCULATION
    // =============================================

    const gst = subtotal * 0.05;

    // Final value is rounded directly.
    // Actual total / round off is NOT displayed.
    const payableAmount = Math.round(subtotal + gst);

    function summaryRow(label, value, bold = false) {
      const y = doc.y;

      doc
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(8)
        .fillColor(bold ? "#111111" : "#555555")
        .text(label, left, y);

      if (value) {
        doc.text(
          value,
          130,
          y,
          {
            width: 100,
            align: "right"
          }
        );
      }

      doc.moveDown(0.55);
    }

    summaryRow(`Total Items (${totalQty})`, "");

    summaryRow(
      "Subtotal",
      rs(subtotal)
    );

    summaryRow(
      "GST (5%)",
      rs(gst)
    );

    doc.moveDown(0.25);

    drawLine(doc, doc.y);

    // =================================================
    // TOTAL PAYABLE
    // =================================================

    doc.moveDown(0.8);

    const totalY = doc.y;

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#111111")
      .text(
        "TOTAL PAYABLE",
        left,
        totalY
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#111111")
      .text(
        rs(payableAmount),
        110,
        totalY - 4,
        {
          width: 120,
          align: "right"
        }
      );

    doc.moveDown(1.2);

    drawLine(doc, doc.y);

    // =================================================
    // PAYMENT STATUS
    // =================================================

    doc.moveDown(0.8);

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#111111")
      .text(
        "PURCHASE SUCCESSFUL",
        center
      );

    doc.moveDown(0.35);

    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor("#8E8E93")
      .text(
        "Thank you for choosing Smart Trolley.",
        center
      );

    // =================================================
    // FOOTER
    // =================================================

    doc.moveDown(1.5);

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#111111")
      .text(
        "Thank You!",
        center
      );

    doc.moveDown(0.35);

    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor("#8E8E93")
      .text(
        "Smart Shopping • Faster Checkout",
        center
      );

    doc.moveDown(0.3);

    doc
      .fontSize(6.5)
      .text(
        `Bill ID: ${bill.id}`,
        center
      );

    // =================================================
    // FINISH
    // =================================================

    doc.end();

    stream.on("finish", () => {
      console.log(
        "📄 Premium PDF generated:",
        filePath
      );

      resolve(filePath);
    });

    stream.on("error", (error) => {
      console.error(
        "❌ PDF generation error:",
        error
      );

      reject(error);
    });

  });
}

module.exports = { generatePDF };