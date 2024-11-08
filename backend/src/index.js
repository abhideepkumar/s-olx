const express = require("express");
const connectDb = require("./db");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");

// first start express
const app = express(express.json({ limit: "16kb" }));
// use cors
app.use(cors());
// more express configs
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// cookieparser
app.use(cookieParser());

connectDb()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log("App started at port: ", process.env.PORT);
    });
  })
  .catch(() => {
    console.log("Error in connecting to database");
  });
app.on("error", () => {
  console.log("Error in starting express app");
});
