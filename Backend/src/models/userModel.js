import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        requred:true
    },
    email: {
        type: String,
        requred: true,
        unique:true
    },
    password: {
        type: String,
        required:true
    },

},
    {
        timestamps:true
    }
)

export default mongoose.model('User', userSchema);
