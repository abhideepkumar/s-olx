const express = require('express');
const connectDb = require('./db');
require('dotenv').config();

const app = express();

connectDb()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log('App started at port: ', process.env.PORT);
    });
  })
  .catch(() => {
    console.log('Error in connecting to database');
  });
app.on('error', () => {
  console.log('Error in starting express app');
});
