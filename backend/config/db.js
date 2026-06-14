// config/db.js
// Handles the connection between our Express app and MongoDB using Mongoose.

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // mongoose.connect() returns a promise that resolves once connected
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // conn.connection.host tells us which DB host we connected to
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If connection fails, log the error and stop the server
    // (no point running an API that can't reach its database)
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;