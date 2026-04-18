// middlewares/authMiddleware.js (ES6 module version)

import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { getJwtSecret, generateToken } from "../utils/jwt.js";

const THREE_DAYS_SEC = 3 * 24 * 60 * 60;

// Middleware to protect routes
export const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (!token || !token.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }
    token = token.slice(7).trim();
    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found or token invalid" });
    }
    req.user = user;

    const expSec = decoded.exp;
    if (expSec) {
      const left = expSec - Math.floor(Date.now() / 1000);
      if (left > 0 && left < THREE_DAYS_SEC) {
        try {
          const role = user.role ?? "user";
          const fresh = generateToken(user._id.toString(), role);
          res.setHeader("X-New-Token", fresh);
        } catch (e) {
          console.error("[jwt refresh]", e);
        }
      }
    }

    next();
  } catch {
    res.status(401).json({ message: "Token failed" });
  }
};

/** Sets req.user when Authorization Bearer is valid; otherwise continues without user. */
export const optionalAuth = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (token && token.startsWith("Bearer ")) {
      token = token.slice(7).trim();
      if (token) {
        const decoded = jwt.verify(token, getJwtSecret());
        req.user = await User.findById(decoded.id).select("-password");
        const expSec = decoded.exp;
        if (expSec && req.user) {
          const left = expSec - Math.floor(Date.now() / 1000);
          if (left > 0 && left < THREE_DAYS_SEC) {
            try {
              const role = req.user.role ?? "user";
              res.setHeader(
                "X-New-Token",
                generateToken(req.user._id.toString(), role)
              );
            } catch (e) {
              console.error("[jwt refresh optional]", e);
            }
          }
        }
      }
    }
  } catch {
    req.user = undefined;
  }
  next();
};
