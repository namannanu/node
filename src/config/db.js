const mongoose = require('mongoose');
const colors = require('colors');

const connectDB = async () => {
    console.log('Attempting to connect to MongoDB...'); // Debug log
    try {
        console.log('entered'); // Debug log
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            //useNewUrlParser: true,
           // useCreateIndex:true,
           // useFindAndModify:true,
            // useUnifiedTopology is deprecated in newer versions
        });
        console.log(`MongoDB connected: ${conn.connection.host}`.cyan.bold);
        console.log(`ho la la `);
    } catch (error) {
        console.error(`Error: ${error.message}`.red.bold);
        process.exit(1); // Exit the process with failure
    }
};

module.exports = connectDB;