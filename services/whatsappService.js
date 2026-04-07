const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendWhatsApp(number, fileName) {

  try {

    const pdfUrl = `${process.env.BASE_URL}/bills/${fileName}`;

    const msg = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:+91${number}`,
      body: "🧾 Your Smart Trolley Bill",
      mediaUrl: [pdfUrl] // 🔥 THIS SENDS PDF FILE
    });

    console.log("✅ WhatsApp PDF sent:", msg.sid);

  } catch (err) {
    console.log("❌ Twilio Error:", err.message);
  }
}

module.exports = { sendWhatsApp };