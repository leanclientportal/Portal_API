const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://aisdeveloper11_db_user:cdMNtTp7nu3AJXFy@tenant-portal-cluster.6icl4sd.mongodb.net/";
    const dbName = process.env.MONGODB_DB || process.env.DB_NAME || "tenantportal";

    const conn = await mongoose.connect(mongoUri, {
      dbName,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}${dbName ? '/' + dbName : ''}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;