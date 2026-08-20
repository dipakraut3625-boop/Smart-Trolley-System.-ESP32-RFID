const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function rs(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

function generatePDF(bill) {
  return new Promise((resolve, reject) => {

    // ================= CALCULATIONS =================

    let subtotal = 0;
    let totalQty = 0;

    const items = bill.items.map((item) => {

      const mrp = Number(item.price || 0);

      // Smart Trolley Mart price: 5% discount
      const martPrice = mrp * 0.95;

      const itemTotal = martPrice * Number(item.qty || 1);

      subtotal += itemTotal;
      totalQty += Number(item.qty || 1);

      return {
        name: item.name || "Item",
        qty: Number(item.qty || 1),
        price: martPrice,
        total: itemTotal
      };
    });

    const gst = subtotal * 0.05;

    // Final payable amount
    const exactTotal = subtotal + gst;

    // Directly convert to rounded payable amount
    const grandTotal = Math.round(exactTotal);

    // Dynamic PDF height
    const pageHeight = Math.max(
      650,
      470 + items.length * 42
    );

    // ================= FILE SETUP =================

    const billsDir = path.join(__dirname, "../bills");

    if (!fs.existsSync(billsDir)) {
      fs.mkdirSync(billsDir, { recursive: true });
    }

    const filePath = path.join(
      billsDir,
      `bill-${bill.id}.pdf`
    );

    const doc = new PDFDocument({
      size: [320, pageHeight],
      margin: 0
    });

    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // ================= LAYOUT =================

    const pageWidth = 320;

    const left = 24;
    const right = 296;
    const contentWidth = right - left;

    let y = 24;

    function line() {
      doc
        .strokeColor("#D8DDE6")
        .lineWidth(0.7)
        .moveTo(left, y)
        .lineTo(right, y)
        .stroke();

      y += 14;
    }

    function textLeft(text, size = 9, bold = false) {
      doc
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(size)
        .fillColor("#333333")
        .text(String(text), left, y, {
          width: contentWidth,
          align: "left"
        });
    }

    function textRight(text, size = 9, bold = false) {
      doc
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(size)
        .fillColor("#333333")
        .text(String(text), left, y, {
          width: contentWidth,
          align: "right"
        });
    }

    function labelValue(label, value, boldValue = false) {

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#6B7280")
        .text(label, left, y, {
          width: 150,
          align: "left"
        });

      doc
        .font(boldValue ? "Helvetica-Bold" : "Helvetica")
        .fontSize(9)
        .fillColor("#1F2937")
        .text(String(value), 170, y, {
          width: right - 170,
          align: "right"
        });

      y += 18;
    }

    // ================= HEADER =================

    doc
      .font("Helvetica-Bold")
      .fontSize(24)
      .fillColor("#1F2937")
      .text("SMART", left, y, {
        width: contentWidth,
        align: "center"
      });

    y += 27;

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#374151")
      .text("TROLLEY", left, y, {
        width: contentWidth,
        align: "center"
      });

    y += 24;

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#8A94A6")
      .text("SMART SHOPPING, SIMPLIFIED", left, y, {
        width: contentWidth,
        align: "center"
      });

    y += 26;

    line();

    // ================= BILL DETAILS =================

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#374151")
      .text("BILL DETAILS", left, y);

    y += 22;

    labelValue(
      "Bill No.",
      `#${bill.id}`,
      true
    );

    const formattedDate = new Date(
      bill.time
    ).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });

    labelValue(
      "Date & Time",
      formattedDate
    );

    labelValue(
      "Customer",
      bill.customerName || "Walk-in Customer",
      true
    );

    y += 2;

    line();

    // ================= SHOPPING SUMMARY =================

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#374151")
      .text("SHOPPING SUMMARY", left, y);

    y += 22;

    // Table Header

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor("#8A94A6")
      .text("ITEM", left, y, {
        width: 145
      });

    doc.text("QTY", 178, y, {
      width: 35,
      align: "center"
    });

    doc.text("AMOUNT", 220, y, {
      width: 76,
      align: "right"
    });

    y += 16;

    doc
      .strokeColor("#D8DDE6")
      .lineWidth(0.7)
      .moveTo(left, y)
      .lineTo(right, y)
      .stroke();

    y += 12;

    // ================= ITEMS =================

    items.forEach((item) => {

      const itemY = y;

      // Item Name
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#2F3540")
        .text(item.name, left, itemY, {
          width: 145,
          height: 20
        });

      // Price per item below item name
      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor("#8A94A6")
        .text(`${rs(item.price)} each`, left, itemY + 13, {
          width: 145
        });

      // Quantity
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#374151")
        .text(item.qty, 178, itemY + 4, {
          width: 35,
          align: "center"
        });

      // Amount
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#374151")
        .text(rs(item.total), 220, itemY + 4, {
          width: 76,
          align: "right"
        });

      y += 36;
    });

    y += 4;

    line();

    // ================= PAYMENT SUMMARY =================

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#374151")
      .text("PAYMENT SUMMARY", left, y);

    y += 22;

    labelValue(
      `Total Items (${totalQty})`,
      ""
    );

    labelValue(
      "Subtotal",
      rs(subtotal)
    );

    labelValue(
      "GST (5%)",
      rs(gst)
    );

    y += 3;

    // ================= TOTAL BOX =================

    doc
      .strokeColor("#D8DDE6")
      .lineWidth(1)
      .moveTo(left, y)
      .lineTo(right, y)
      .stroke();

    y += 14;

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#1F2937")
      .text("TOTAL PAYABLE", left, y, {
        width: 150
      });

    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor("#1F2937")
      .text(rs(grandTotal), 165, y - 4, {
        width: right - 165,
        align: "right"
      });

    y += 34;

    line();

    // ================= SUCCESS MESSAGE =================

    y += 6;

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#374151")
      .text("PURCHASE SUCCESSFUL", left, y, {
        width: contentWidth,
        align: "center"
      });

    y += 22;

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#8A94A6")
      .text(
        "Thank you for choosing Smart Trolley.",
        left,
        y,
        {
          width: contentWidth,
          align: "center"
        }
      );

    y += 28;

    // ================= THANK YOU =================

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#2F3540")
      .text("Thank You!", left, y, {
        width: contentWidth,
        align: "center"
      });

    y += 28;

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#8A94A6")
      .text("Smart Shopping • Faster Checkout", left, y, {
        width: contentWidth,
        align: "center"
      });

    y += 18;

    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor("#A0A7B3")
      .text(`Bill ID: ${bill.id}`, left, y, {
        width: contentWidth,
        align: "center"
      });

    // ================= FINISH =================

    doc.end();

    stream.on("finish", () => {
      resolve(filePath);
    });

    stream.on("error", (error) => {
      reject(error);
    });

  });
}

module.exports = { generatePDF };