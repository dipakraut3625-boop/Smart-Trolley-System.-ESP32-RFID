const mongoose = require("mongoose");

const BillSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true
    },

    time: {
      type: Date,
      default: Date.now,
      index: true
    },

    items: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },

    customerName: {
      type: String,
      default: ""
    }
  },
  {
    versionKey: false
  }
);

module.exports = mongoose.model("Bill", BillSchema);