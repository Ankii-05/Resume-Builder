import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";
import { normalizeEmail } from "../utils/authHelpers.js";
import {
  sendWelcomeEmail,
  sendAdminNewUserNotification,
} from "../utils/mailer.js";

export const registerUser = async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = normalizeEmail(req.body.email);
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: String(name).trim(),
      email,
      password: hashedPassword,
      provider: "local",
      isEmailVerified: false,
    });

    try {
      sendWelcomeEmail(user.email, user.name);
      sendAdminNewUserNotification(
        user.email,
        user.name,
        "Self-registration"
      );
    } catch (emailErr) {
      console.error("[register emails]", emailErr);
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role ?? "user",
      token: generateToken(user._id, user.role ?? "user"),
    });
  } catch (error) {
    const body = { message: "Server error" };
    if (process.env.NODE_ENV !== "production" && error?.message) {
      body.error = error.message;
    }
    res.status(500).json(body);
  }
};

export const loginUser = async (req, res) => {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.provider === "google" && !user.password) {
      return res.status(400).json({
        message: "This account uses Google sign-in. Continue with Google.",
      });
    }

    if (!user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    user.lastLogin = new Date();
    await user.save();

    const fresh = await User.findById(user._id).select("name email role");
    const role = fresh?.role === "admin" ? "admin" : "user";

    res.json({
      _id: fresh._id,
      name: fresh.name,
      email: fresh.email,
      role,
      token: generateToken(fresh._id, role),
    });
  } catch (error) {
    const body = { message: "Server error" };
    if (process.env.NODE_ENV !== "production" && error?.message) {
      body.error = error.message;
    }
    res.status(500).json(body);
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const o = user.toObject();
    o.role = o.role ?? "user";
    res.json(o);
  } catch (error) {
    const body = { message: "Server error" };
    if (process.env.NODE_ENV !== "production" && error?.message) {
      body.error = error.message;
    }
    res.status(500).json(body);
  }
};

export const verifyAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
        role: user.role ?? "user",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const logoutUser = async (_req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
};
