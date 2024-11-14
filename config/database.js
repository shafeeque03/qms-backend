import mongoose from 'mongoose';
import dotenv from 'dotenv'

dotenv.config()
async function dbconnect() {
    const mongourl = process.env.MONGO_URL
    try {
        if (!mongourl) {
            return;
        }
        await mongoose.connect(mongourl);
        console.log('Database connected successfully');
    } catch (error) {
        console.log(error);
    }
}

export default dbconnect