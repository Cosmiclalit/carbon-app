const mongoose = require("mongoose");

const carbonSchema = new mongoose.Schema({
  electricity: Number,
  acHours: Number,
  transport: String,
  shopping: Number,
  totalCO2: Number,
  rating: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Carbon", carbonSchema);