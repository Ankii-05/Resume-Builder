import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import Resume from "../models/Resume.js";
import AtsLog from "../models/AtsLog.js";
import PdfDownloadLog from "../models/PdfDownloadLog.js";
import { normalizeEmail } from "../utils/authHelpers.js";
import { clientUrl } from "../utils/clientUrl.js";
import {
  sendWelcomeWithCredentials,
  sendAdminNewUserNotification,
} from "../utils/mailer.js";

function jsonError(res, status, message, err) {
  const body = { message };
  if (process.env.NODE_ENV !== "production" && err?.message) {
    body.error = err.message;
  }
  return res.status(status).json(body);
}

export async function getAdminStats(req, res) {
  try {
    const [
      totalUsers,
      totalResumes,
      activeResumes,
      completedResumes,
      totalAtsChecks,
    ] = await Promise.all([
      User.countDocuments(),
      Resume.countDocuments(),
      Resume.countDocuments({ isCompleted: false }),
      Resume.countDocuments({ isCompleted: true }),
      AtsLog.countDocuments(),
    ]);

    const sumAgg = await Resume.aggregate([
      { $group: { _id: null, total: { $sum: "$downloadCount" } } },
    ]);
    const totalDownloads = sumAgg[0]?.total ?? 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const growthRaw = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const byDay = Object.fromEntries(growthRaw.map((g) => [g._id, g.count]));
    const userGrowth = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      userGrowth.push({ date: key, count: byDay[key] || 0 });
    }

    res.json({
      totalUsers,
      totalResumes,
      activeResumes,
      completedResumes,
      totalDownloads,
      totalAtsChecks,
      userGrowth,
    });
  } catch (err) {
    jsonError(res, 500, "Failed to load stats", err);
  }
}

export async function listAdminUsers(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const search = (req.query.search || "").trim();

    const match = {};
    if (search) {
      match.$or = [
        { name: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
        { email: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      ];
    }

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: "resumes",
          localField: "_id",
          foreignField: "userId",
          as: "_res",
        },
      },
      { $addFields: { resumesCount: { $size: "$_res" } } },
      {
        $project: {
          _res: 0,
          password: 0,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          total: [{ $count: "n" }],
        },
      },
    ];

    const agg = await User.aggregate(pipeline);
    const data = agg[0]?.data || [];
    const total = agg[0]?.total[0]?.n ?? 0;

    res.json({
      data,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    jsonError(res, 500, "Failed to list users", err);
  }
}

export async function getAdminUser(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resumes = await Resume.find({ userId: id }).sort({ updatedAt: -1 });
    const atsLogs = await AtsLog.find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ user, resumes, atsLogs });
  } catch (err) {
    jsonError(res, 500, "Failed to load user", err);
  }
}

export async function updateAdminUser(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, email, role, password } = req.body;

    if (name != null) user.name = String(name).trim();
    if (email != null) {
      const em = normalizeEmail(email);
      if (!em) {
        return res.status(400).json({ message: "Invalid email" });
      }
      const taken = await User.findOne({ email: em, _id: { $ne: id } });
      if (taken) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = em;
    }
    if (role != null) {
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      user.role = role;
    }
    if (password != null && String(password).length > 0) {
      if (String(password).length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      user.provider = "local";
    }

    await user.save();
    const out = await User.findById(id).select("-password");
    res.json(out);
  } catch (err) {
    jsonError(res, 500, "Failed to update user", err);
  }
}

export async function deleteAdminUser(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (req.user._id.toString() === id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await Resume.deleteMany({ userId: id });
    await AtsLog.deleteMany({ userId: id });
    await User.findByIdAndDelete(id);

    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    jsonError(res, 500, "Failed to delete user", err);
  }
}

export async function listAdminResumes(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const userId = (req.query.userId || "").trim();

    const match = {};
    if (userId && mongoose.isValidObjectId(userId)) {
      match.userId = new mongoose.Types.ObjectId(userId);
    }

    const total = await Resume.countDocuments(match);
    const rows = await Resume.find(match)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email")
      .lean();

    res.json({
      data: rows,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    jsonError(res, 500, "Failed to list resumes", err);
  }
}

export async function getAdminResume(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid resume id" });
    }

    const resume = await Resume.findById(id).populate("userId", "name email role");
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    res.json(resume);
  } catch (err) {
    jsonError(res, 500, "Failed to load resume", err);
  }
}

export async function deleteAdminResume(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid resume id" });
    }

    const resume = await Resume.findByIdAndDelete(id);
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    res.json({ success: true, message: "Resume deleted" });
  } catch (err) {
    jsonError(res, 500, "Failed to delete resume", err);
  }
}

export async function listAdminAtsLogs(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const userId = (req.query.userId || "").trim();
    const domain = (req.query.domain || "").trim();

    const match = {};
    if (userId && mongoose.isValidObjectId(userId)) {
      match.userId = new mongoose.Types.ObjectId(userId);
    }
    if (domain) {
      match.domain = domain;
    }

    const total = await AtsLog.countDocuments(match);
    const rows = await AtsLog.find(match)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email")
      .lean();

    res.json({
      data: rows,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    jsonError(res, 500, "Failed to list ATS logs", err);
  }
}

export async function createAdminUser(req, res) {
  try {
    const { name, email, password, role } = req.body || {};
    if (role != null && role !== "user") {
      return res.status(400).json({ message: "Only the user role is allowed here" });
    }
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Name is required" });
    }
    const em = normalizeEmail(email);
    if (!em) {
      return res.status(400).json({ message: "Valid email is required" });
    }
    if (!password || String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const taken = await User.findOne({ email: em });
    if (taken) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(password), salt);

    const user = await User.create({
      name: String(name).trim(),
      email: em,
      password: hashedPassword,
      provider: "local",
      isEmailVerified: false,
      role: "user",
    });

    const plainPassword = String(password);
    const loginUrl = `${clientUrl().replace(/\/$/, "")}/login`;
    const adminLabel = req.user?.name
      ? `Admin: ${req.user.name} (${req.user.email})`
      : `Admin: ${req.user?.email || "unknown"}`;

    try {
      sendWelcomeWithCredentials(user.email, user.name, plainPassword, loginUrl);
      sendAdminNewUserNotification(user.email, user.name, adminLabel);
    } catch (e) {
      console.error("[createAdminUser email]", e);
    }

    const out = await User.findById(user._id).select("-password").lean();
    res.status(201).json(out);
  } catch (err) {
    jsonError(res, 500, "Failed to create user", err);
  }
}

export async function getRecentAts(req, res) {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 5));
    const rows = await AtsLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "name email")
      .lean();
    res.json({ data: rows });
  } catch (err) {
    jsonError(res, 500, "Failed to load ATS logs", err);
  }
}

export async function getRecentResumes(req, res) {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 5));
    const rows = await Resume.find()
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate("userId", "name email")
      .lean();
    res.json({ data: rows });
  } catch (err) {
    jsonError(res, 500, "Failed to load resumes", err);
  }
}

export async function getDomainUsage(req, res) {
  try {
    const rows = await AtsLog.aggregate([
      { $group: { _id: "$domain", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({
      data: rows.map((r) => ({ domain: r._id || "—", count: r.count })),
    });
  } catch (err) {
    jsonError(res, 500, "Failed to load domain usage", err);
  }
}

export async function getAdminStatsMonthly(req, res) {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const [atsChecksThisMonth, pdfDownloadsThisMonth, avgAgg] = await Promise.all([
      AtsLog.countDocuments({ createdAt: { $gte: start } }),
      PdfDownloadLog.countDocuments({ createdAt: { $gte: start } }),
      AtsLog.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: null, avg: { $avg: "$overallScore" } } },
      ]),
    ]);
    const rawAvg = avgAgg[0]?.avg ?? 0;
    const avgAtsScore = Math.round(rawAvg * 10) / 10;

    const topDomainRows = await AtsLog.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: "$domain", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);
    const mostUsedDomain = topDomainRows[0]?._id ?? null;

    res.json({
      atsChecksThisMonth,
      pdfDownloadsThisMonth,
      avgAtsScore,
      mostUsedDomain,
    });
  } catch (err) {
    jsonError(res, 500, "Failed to load monthly stats", err);
  }
}
