const mongoose = require('mongoose');
const dotenv = require('dotenv');

mongoose.set('strictQuery', false);
dotenv.config({ path: './.env' });

const app = require('./app');

const DB = process.env.DB.replace(
    '<DB_USERNAME>',
    process.env.DB_USERNAME
).replace('<DB_PASSWORD>', process.env.DB_PASSWORD);

const connectDB = async () => {
    try {
        await mongoose.connect(DB);
        console.log('DB connection successful');
    } catch (err) {
        throw err;
    }
};

connectDB();

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
    console.log(`App running on port ${port}`);
});
