const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
  data:{
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  status : {
     type : Boolean,
     default : false
  }
});

module.exports = mongoose.model("Job", JobSchema);
