import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect('mongodb+srv://ankitkushwah6195:Ankit%402003@cluster0.cuexyu3.mongodb.net/Resume-Builder')
        .then(() => console.log("DB CONNECTED"));
}

