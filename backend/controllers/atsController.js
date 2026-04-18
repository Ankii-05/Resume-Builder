import multer from "multer";
import { DOMAIN_KEYWORDS } from "../data/domainKeywords.js";
import { parseResume, PDF_MIME, DOCX_MIME } from "../utils/resumeParser.js";
import { scoreResume, packFromAdminKeywords } from "../utils/atsScorer.js";
import AtsLog from "../models/AtsLog.js";
import AtsDomainProfile from "../models/AtsDomainProfile.js";

const MAX_BYTES = 5 * 1024 * 1024;

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === PDF_MIME || file.mimetype === DOCX_MIME;
    if (ok) cb(null, true);
    else cb(new Error("Only PDF or Word (.docx) files are allowed."));
  },
});

function suggestionsToStrings(suggestions) {
  if (!Array.isArray(suggestions)) return [];
  return suggestions
    .map((s) => (typeof s === "string" ? s : s?.text || ""))
    .filter(Boolean);
}

async function resolveDomainScoring(slug) {
  const s = String(slug || "").trim().toLowerCase();
  if (!s) return null;

  const profile = await AtsDomainProfile.findOne({
    slug: s,
    isActive: true,
  }).lean();
  if (profile?.keywords?.length) {
    return {
      slug: profile.slug,
      label: profile.name || profile.slug.replace(/_/g, " "),
      pack: packFromAdminKeywords(profile.keywords),
    };
  }

  const staticPack = DOMAIN_KEYWORDS[s];
  if (staticPack) {
    return {
      slug: s,
      label: s.replace(/_/g, " "),
      pack: { ...staticPack, extraKeywords: [] },
    };
  }

  return null;
}

export async function checkAts(req, res) {
  try {
    const file = req.file;
    const domain = String(req.body.domain || "").trim().toLowerCase();

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Resume file is required.",
      });
    }

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: "Job domain is required.",
      });
    }

    const resolved = await resolveDomainScoring(domain);
    if (!resolved) {
      return res.status(400).json({
        success: false,
        message: "Unknown or inactive domain. Pick a domain from the list.",
      });
    }

    let text;
    try {
      text = await parseResume(file.buffer, file.mimetype);
    } catch (parseErr) {
      console.error("Resume parse error:", parseErr);
      return res.status(400).json({
        success: false,
        message: "Could not read that file. Try another PDF or DOCX export.",
      });
    }

    if (!text || text.length < 40) {
      return res.status(400).json({
        success: false,
        message:
          "Very little text was extracted. Try a text-based PDF or DOCX (not a scan-only image).",
      });
    }

    const data = scoreResume(
      text,
      resolved.slug,
      resolved.pack,
      resolved.label
    );

    const userId = req.user?._id || null;
    const fileName = file.originalname || "upload";

    try {
      await AtsLog.create({
        userId,
        fileName,
        domain: resolved.slug,
        overallScore: data.overall,
        label: data.label,
        breakdown: data.breakdown,
        matchedKeywords: data.matchedKeywords || [],
        missingKeywords: data.missingKeywords || [],
        suggestions: suggestionsToStrings(data.suggestions),
      });
    } catch (logErr) {
      console.error("AtsLog save error:", logErr);
    }

    return res.json({ success: true, data });
  } catch (e) {
    console.error("ATS check error:", e);
    return res.status(500).json({
      success: false,
      message: "Analysis failed. Please try again.",
    });
  }
}
