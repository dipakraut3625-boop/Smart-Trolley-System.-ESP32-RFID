const express = require("express");
const router = express.Router();

const Bill = require("../models/Bill");
const { generatePDF } = require("../services/pdfService");
const { sendWhatsApp } = require("../services/whatsappService");


// =====================================================
// TROLLEY TRACKING
// =====================================================

let trolleys = {};


// =====================================================
// CREATE BILL
// =====================================================

router.post("/create-bill", async (req, res) => {
  try {

    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        error: "Items must be an array"
      });
    }


    // Create bill in MongoDB
    const bill = await Bill.create({

      id: Date.now(),

      time: new Date(),

      items: items,

      customerName: ""

    });


    console.log("✅ Bill saved to MongoDB:", bill.id);


    // Generate PDF
    try {

      const pdfPath = await generatePDF(bill.toObject());

      console.log("✅ PDF Generated:", pdfPath);

    } catch (pdfError) {

      console.log("⚠️ PDF generation error:", pdfError.message);

    }


    // Send live update to Admin Dashboard
    const io = req.app.get("io");

    if (io) {
      io.emit("new-bill", bill.toObject());
    }


    res.json({

      success: true,

      billId: bill.id,

      url: `/bill/${bill.id}`

    });


  } catch (error) {

    console.error("❌ CREATE BILL ERROR:", error);

    res.status(500).json({

      error: "Failed to create bill",

      details: error.message

    });

  }

});



// =====================================================
// GET SINGLE BILL
// =====================================================

router.get("/bill/:id", async (req, res) => {

  try {

    const bill = await Bill.findOne({
      id: Number(req.params.id)
    }).lean();


    if (!bill) {

      return res.status(404).json({

        error: "Bill not found"

      });

    }


    res.json(bill);


  } catch (error) {

    console.error("❌ GET BILL ERROR:", error);


    res.status(500).json({

      error: "Failed to load bill"

    });

  }

});



// =====================================================
// GET ALL BILLS
// =====================================================

router.get("/bills", async (req, res) => {

  try {

    const bills = await Bill
      .find()
      .sort({ time: -1 })
      .lean();


    res.json(bills);


  } catch (error) {

    console.error("❌ GET BILLS ERROR:", error);


    res.status(500).json({

      error: "Failed to load bills"

    });

  }

});



// =====================================================
// SEND BILL ON WHATSAPP
// =====================================================

router.post("/send-whatsapp", async (req, res) => {

  try {

    const {
      id,
      phone,
      name
    } = req.body;


    // Find bill
    const bill = await Bill.findOne({

      id: Number(id)

    });


    if (!bill) {

      return res.status(404).json({

        error: "Bill not found"

      });

    }


    // Save customer name
    bill.customerName = name;

    await bill.save();


    // Generate PDF
    const pdfPath = await generatePDF(
      bill.toObject()
    );


    // Get filename
    const path = require("path");

    const fileName = path.basename(pdfPath);


    console.log(
      "📄 Sending PDF:",
      fileName
    );


    // Send WhatsApp
    await sendWhatsApp(
      phone,
      fileName
    );


    // Update Admin Dashboard
    const io = req.app.get("io");

    if (io) {

      io.emit(
        "bill-updated",
        bill.toObject()
      );

    }


    res.json({

      success: true,

      message: "WhatsApp bill sent successfully"

    });


  } catch (error) {

    console.error(
      "❌ WHATSAPP ERROR:",
      error
    );


    res.status(500).json({

      error: "Failed to send WhatsApp",

      details: error.message

    });

  }

});



// =====================================================
// TROLLEY UPDATE
// =====================================================

router.get("/trolley-update", (req, res) => {

  const {
    trolleyId
  } = req.query;


  if (!trolleyId) {

    return res.status(400).send(
      "Missing trolleyId"
    );

  }


  trolleys[trolleyId] = {

    lastActive: new Date()

  };


  const io = req.app.get("io");

  if (io) {

    io.emit(
      "trolley-update",
      trolleys
    );

  }


  res.send(
    "Trolley Updated"
  );

});



// =====================================================
// GET TROLLEYS
// =====================================================

router.get("/trolleys", (req, res) => {

  res.json(trolleys);

});


module.exports = router;