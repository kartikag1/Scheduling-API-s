const mongoose = require("mongoose");

const DataSchema = new mongoose.Schema({
  data:{
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  redis_key: {
    type: String
  }
});

module.exports = mongoose.model("Data", DataSchema);
