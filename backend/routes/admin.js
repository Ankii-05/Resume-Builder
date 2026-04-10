import express from "express";
import { isAdmin } from "../middlewares/isAdmin.js";
import {
  getAdminStats,
  listAdminUsers,
  getAdminUser,
  updateAdminUser,
  deleteAdminUser,
  listAdminResumes,
  getAdminResume,
  deleteAdminResume,
  listAdminAtsLogs,
  createAdminUser,
  getRecentAts,
  getRecentResumes,
  getDomainUsage,
  getAdminStatsMonthly,
} from "../controllers/adminController.js";
import {
  listAtsDomainsAdmin,
  createAtsDomain,
  updateAtsDomain,
  deleteAtsDomain,
} from "../controllers/atsDomainController.js";

const router = express.Router();

router.use(...isAdmin);

router.get("/stats", getAdminStats);
router.get("/stats/monthly", getAdminStatsMonthly);
router.get("/stats/recent-ats", getRecentAts);
router.get("/stats/recent-resumes", getRecentResumes);
router.get("/stats/domain-usage", getDomainUsage);

router.post("/users/create", createAdminUser);
router.get("/users", listAdminUsers);
router.get("/users/:id", getAdminUser);
router.put("/users/:id", updateAdminUser);
router.delete("/users/:id", deleteAdminUser);
router.get("/resumes", listAdminResumes);
router.get("/resumes/:id", getAdminResume);
router.delete("/resumes/:id", deleteAdminResume);
router.get("/ats-logs", listAdminAtsLogs);

router.get("/ats-domains", listAtsDomainsAdmin);
router.post("/ats-domains", createAtsDomain);
router.put("/ats-domains/:id", updateAtsDomain);
router.delete("/ats-domains/:id", deleteAtsDomain);

export default router;
