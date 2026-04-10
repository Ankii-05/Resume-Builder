import express from "express";
import multer from "multer";
import { optionalAuth } from "../middlewares/authMiddleware.js";
import { checkAts, upload } from "../controllers/atsController.js";
import { listAtsDomainsPublic } from "../controllers/atsDomainController.js";

const router = express.Router();

router.get("/domains", listAtsDomainsPublic);

router.post(
  "/check",
  optionalAuth,
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
  checkAts
);

export default router;
