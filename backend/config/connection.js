import mongoose from "mongoose"
import dotenv from 'dotenv';

dotenv.config();
const dbConnect=async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGO_URL}`);
        console.log("Database Connected");
    } catch (error) {
        console.log("Database Connection failed", error);
    }
}

export {dbConnect};