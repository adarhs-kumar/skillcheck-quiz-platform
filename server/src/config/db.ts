import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillcheck');
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`[MongoDB] Error: ${error.message}`);
    process.exit(1);
  }
};
