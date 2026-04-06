// middlewares/authMiddleware.js (ES6 module version)

import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { getJwtSecret } from "../utils/jwt.js";

// Middleware to protect routes
export const protect = async (req, res, next) => {
    try {
        let token = req.headers.authorization;

        if (token && token.startsWith("Bearer ")) {
            token = token.slice(7).trim();
            if (!token) {
                return res.status(401).json({ message: "Not authorized, no token" });
            }
            const decoded = jwt.verify(token, getJwtSecret());
            req.user = await User.findById(decoded.id).select("-password");
            if (!req.user) {
                return res.status(401).json({ message: "User not found or token invalid" });
            }
            next();
        } else {
            res.status(401).json({ message: "Not authorized, no token" });
        }
    } catch (error) {
        res.status(401).json({ message: "Token failed", error: error.message });
    }
};
