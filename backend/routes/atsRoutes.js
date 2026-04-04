import express from "express";
import multer from "multer";
import { VALID_DOMAIN_KEYS } from "../data/domainKeywords.js";
import { parseResume, PDF_MIME, DOCX_MIME } from "../utils/resumeParser.js";
import { scoreResume } from "../utils/atsScorer.js";

const router = express.Router();

const MAX_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === PDF_MIME || file.mimetype === DOCX_MIME;
    if (ok) cb(null, true);
    else cb(new Error("Only PDF or Word (.docx) files are allowed."));
  },
});

router.post(
  "/check",
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          success: false,
          message: "File too large. Maximum size is 5MB.",
        });
      }
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Upload failed",
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const file = req.file;
      const domain = (req.body.domain || "").trim();
      const customDomain = (req.body.customDomain || "").trim();

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "Resume file is required.",
        });
      }

      if (!domain || !VALID_DOMAIN_KEYS.includes(domain)) {
        return res.status(400).json({
          success: false,
          message: "Select a valid job domain.",
        });
      }

      if (domain === "custom" && customDomain.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Enter a short target role or domain for Custom.",
        });
      }

      let text;
      try {
        text = await parseResume(file.buffer, file.mimetype);
      } catch (parseErr) {
        console.error("Resume parse error:", parseErr);
        return res.status(400).json({
          success: false,
          message:
            "Could not read that file. Try another PDF or DOCX export.",
        });
      }

      if (!text || text.length < 40) {
        return res.status(400).json({
          success: false,
          message:
            "Very little text was extracted. Try a text-based PDF or DOCX (not a scan-only image).",
        });
      }

      const data = scoreResume(text, domain, customDomain);

      return res.json({ success: true, data });
    } catch (e) {
      console.error("ATS check error:", e);
      return res.status(500).json({
        success: false,
        message: "Analysis failed. Please try again.",
      });
    }
  }
);

export default router;
