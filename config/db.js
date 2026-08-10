const mongoose = require("mongoose");

async function connectDB() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("🟢 MongoDB connected successfully");
    console.log("📦 Database:", mongoose.connection.name);

  } catch (error) {

    console.error("🔴 MongoDB connection failed");
    console.error(error.message);

    process.exit(1);
  }
}

module.exports = connectDB;