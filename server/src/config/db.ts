import mongoose from 'mongoose';

export const connectDB = async (mongoUri?: string): Promise<void> => {
  const uri = mongoUri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mise_meal_planner';
  try {
    await mongoose.connect(uri);
    console.log(`[MongoDB] Connected successfully to ${uri}`);
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    process.exit(1);
  }
};
