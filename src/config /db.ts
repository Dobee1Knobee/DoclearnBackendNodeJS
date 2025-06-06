import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('✅ MongoDB подключен');
    } catch (err) {
        console.error('❌ Ошибка подключения к MongoDB:', err);
        process.exit(1);
    }
};
