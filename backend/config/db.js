import mongoose from "mongoose";

const DEFAULT_URI =
  "mongodb+srv://ankitkushwah6195:Ankit%402003@cluster0.cuexyu3.mongodb.net/Resume-Builder";

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || DEFAULT_URI;
  try {
    await mongoose.connect(uri);
    console.log("DB CONNECTED");
  } catch (err) {
    console.warn("MongoDB connection failed — resume/auth need the database. ATS API still runs.");
    console.warn(err?.message || err);
  }
};

