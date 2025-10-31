import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";

export const protect = async (req, res, next) => {
    try {
        let token = req.headers.authorization;
        if (token && token.startsWith("Bearer")) {
            const decoded = jwt.verify(token, "my-secret-key")
            req.user = await userModel.findById(decoded.id).select('-password')
            next()
        }
        else {
            res.status(401).json({msg:"Not authorized, no token found"})
        }
    } catch (error) {
        res.status(401).json({
            msg: "Token failed",
            error: error.msg
        })
    }
}