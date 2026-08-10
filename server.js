require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);


// ================= BILLS DIRECTORY =================

const billsDir = path.join(__dirname, "bills");

if (!fs.existsSync(billsDir)) {
  fs.mkdirSync(billsDir);
}


// ================= MIDDLEWARE =================

app.use(express.json());


// ================= STATIC FILES =================

// Serve PDF bills
app.use(
  "/bills",
  express.static(path.join(__dirname, "bills"))
);

// Serve frontend files
app.use(
  express.static(path.join(__dirname, "public"))
);


// ================= SOCKET.IO =================

app.set("io", io);


// ================= ROUTES =================

const billRoutes = require("./routes/billRoutes");

app.use("/api", billRoutes);


// ================= HOME =================

app.get("/", (req, res) => {
  res.send("🚀 Smart Trolley Backend Running");
});


// ================= BILL PAGE =================

app.get("/bill/:id", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "bill.html")
  );
});


// ================= ADMIN DASHBOARD =================

app.get("/admin", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "admin.html")
  );
});

app.get("/bills", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "bills.html"));
});

app.get("/trolleys", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "trolleys.html"));
});

app.get("/analytics", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "analytics.html"));
});


// ================= SOCKET.IO CONNECTION =================

io.on("connection", (socket) => {

  console.log(
    "🟢 New client connected:",
    socket.id
  );

  socket.on("disconnect", () => {

    console.log(
      "🔴 Client disconnected:",
      socket.id
    );

  });

});


// ================= DATABASE + SERVER =================

const PORT = process.env.PORT || 3000;

async function startServer() {

  try {

    // Connect MongoDB first
    await connectDB();

    // Start server only after MongoDB connects
    server.listen(PORT, () => {

      console.log(
        `🚀 Server running on port ${PORT}`
      );

    });

  } catch (error) {

    console.error(
      "🔴 Server startup failed:"
    );

    console.error(
      error.message
    );

    process.exit(1);

  }

}


// ================= START =================

startServer();