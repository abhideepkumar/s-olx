const mongoose = require('mongoose');
require('dotenv').config();

const connectDb = async () => {
  try {
    const response = await mongoose.connect(`${process.env.MONGODB_URI}/solx`);
    console.log('Connected to Mongodb at ', response.connection.host);
  } catch (error) {
    console.log('Error found connecting to database', error);
    process.exit(1);
  }
};

module.exports = connectDb; 
