if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require("express");
const app = express();
const methodOverride = require("method-override");
const bodyParser = require("body-parser");
const morgan = require('morgan')
const fs = require('fs')
const path = require('path');
const redis = require('redis');
//DB setup-----------------------------------------------------------------------------------------------
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, {
  useUnifiedTopology: true,
  useNewUrlParser: true
});
mongoose.set("useFindAndModify", false);
//--------------------------------------------------------------------------------------------------------

//REDIS setup---------------------------------------------------------------------------------------------
const client = redis.createClient(process.env.PORT||6379);
//--------------------------------------------------------------------------------------------------------

//App setups--------------------------------------------------------------------------------------------
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(
  express.urlencoded({
    extended: false
  })
);
app.use(methodOverride("_method"));
app.use(morgan('combined'))
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
app.use(morgan('combined', { stream: accessLogStream }))

//----------------------------------------------------------------------------------------------------

//Importing routes---------------------------------------------------------------------------------------
var appRouter = require("./routes/app");
appRouter.use((req, res, next) => {
  console.log("/" + req.method);
  next();
});
//-------------------------------------------------------------------------------------------------------

// subpaths--------------------------------------------------------------------------------------------
app.use("/app", appRouter);
//-----------------------------------------------------------------------------------------------------

//handling error 404-----------------------------------------------------------------------------------
app.use("*", (req, res) => {
  res.status(404).send("404");
});
//-----------------------------------------------------------------------------------------------------

//Server setup----------------------------------------------------------------------------------------
let port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log("App running on port "+port);
});
//----------------------------------------------------------------------------------------------------
