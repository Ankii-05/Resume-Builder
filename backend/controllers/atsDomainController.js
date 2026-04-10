import mongoose from "mongoose";
import AtsDomainProfile from "../models/AtsDomainProfile.js";

function jsonError(res, status, message, err) {
  const body = { message };
  if (process.env.NODE_ENV !== "production" && err?.message) {
    body.error = err.message;
  }
  return res.status(status).json(body);
}

export async function listAtsDomainsPublic(_req, res) {
  try {
    const rows = await AtsDomainProfile.find({ isActive: true })
      .select("name slug")
      .sort({ name: 1 })
      .lean();
    res.json({ domains: rows });
  } catch (err) {
    jsonError(res, 500, "Failed to list domains", err);
  }
}

export async function listAtsDomainsAdmin(_req, res) {
  try {
    const rows = await AtsDomainProfile.find()
      .populate("createdBy", "name email")
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ data: rows });
  } catch (err) {
    jsonError(res, 500, "Failed to list domain profiles", err);
  }
}

export async function createAtsDomain(req, res) {
  try {
    const { name, slug, keywords, suggestedKeywords, isActive } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Name is required" });
    }
    const kw = Array.isArray(keywords)
      ? keywords.map((k) => String(k).trim()).filter(Boolean)
      : [];
    if (kw.length === 0) {
      return res.status(400).json({ message: "At least one keyword is required" });
    }
    const sk = Array.isArray(suggestedKeywords)
      ? suggestedKeywords.map((k) => String(k).trim()).filter(Boolean)
      : [];

    const doc = await AtsDomainProfile.create({
      name: String(name).trim(),
      slug: slug != null ? String(slug).trim() : undefined,
      keywords: kw,
      suggestedKeywords: sk,
      isActive: isActive !== false,
      createdBy: req.user?._id || null,
    });
    const out = await AtsDomainProfile.findById(doc._id)
      .populate("createdBy", "name email")
      .lean();
    res.status(201).json(out);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ message: "Slug already exists" });
    }
    jsonError(res, 500, "Failed to create domain profile", err);
  }
}

export async function updateAtsDomain(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const doc = await AtsDomainProfile.findById(id);
    if (!doc) {
      return res.status(404).json({ message: "Domain profile not found" });
    }

    const { name, slug, keywords, suggestedKeywords, isActive } = req.body;
    if (name != null) doc.name = String(name).trim();
    if (slug != null) doc.slug = String(slug).trim();
    if (keywords != null) {
      const kw = Array.isArray(keywords)
        ? keywords.map((k) => String(k).trim()).filter(Boolean)
        : [];
      if (kw.length === 0) {
        return res.status(400).json({ message: "At least one keyword is required" });
      }
      doc.keywords = kw;
    }
    if (suggestedKeywords != null) {
      doc.suggestedKeywords = Array.isArray(suggestedKeywords)
        ? suggestedKeywords.map((k) => String(k).trim()).filter(Boolean)
        : [];
    }
    if (typeof isActive === "boolean") doc.isActive = isActive;

    await doc.save();
    const out = await AtsDomainProfile.findById(doc._id)
      .populate("createdBy", "name email")
      .lean();
    res.json(out);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ message: "Slug already exists" });
    }
    jsonError(res, 500, "Failed to update domain profile", err);
  }
}

export async function deleteAtsDomain(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const doc = await AtsDomainProfile.findByIdAndDelete(id);
    if (!doc) {
      return res.status(404).json({ message: "Domain profile not found" });
    }
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    jsonError(res, 500, "Failed to delete domain profile", err);
  }
}
