import userModel from "../models/userModel.js";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'


// create a jwt token

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, "my-secret-key", {expiresIn:"7d"})
}

export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // check if user already exist
        const userExists = await userModel.findOne({ email })
        if (userExists) {
            return res.status(400).json({ msg: "user already exists" })
        }
        if (password.length < 8) {
            return res.status(400).json({success:false, msg:"Password must be atleast of 8 characters "})
        }

        // Hashing password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt)


        // create a user
        const user = await userModel.create({
            name,
            email,
            password:hashedPassword
        })
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token:generateToken(user._id)
        })
    } catch (error) {
        res.status(500).json({
            msg: "Server Error",
            error:error.msg
        })
    }
}


// Login 
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email })
        
        if (!user) {
            return res.status(500).json({ msg: "Invalid email or password" })
        }

        // compare the password
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(500).json({ msg: "Invalid email or password" })
        }
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token:generateToken(user._id)
        })
    } catch (error) {
        res.status(500).json({
            msg: "Server Error",
            error:error.msg
        })
    }
}


// GETUSER PROFILE FUNCTION
export const getUserProfile = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id).select("-password")
        if (!user) {
            return res.status(404).json({ msg: "user not found" })
        }
        res.json(user)
    } catch (error) {
        res.status(500).json({
            msg: "Server Error",
            error:error.msg
        })
    }
}