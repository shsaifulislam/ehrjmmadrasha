import { Router } from "express";
import { admissionController } from "../controllers/AdmissionController";
import { requireAuth } from "../../../middlewares/auth.middleware";

const router = Router();

// Public routes for applicants
router.post("/", (req, res) => admissionController.create(req, res));
router.get("/verify/:token", (req, res) => admissionController.getByToken(req, res));

// Admin & Staff authenticated routes
router.get("/stats", requireAuth, (req, res) => admissionController.getStats(req, res));
router.get("/export", requireAuth, (req, res) => admissionController.exportCsv(req, res));
router.post("/import", requireAuth, (req, res) => admissionController.importBatch(req, res));

router.get("/", requireAuth, (req, res) => admissionController.getAll(req, res));
router.get("/:id", requireAuth, (req, res) => admissionController.getById(req, res));
router.get("/:id/receipt", requireAuth, (req, res) => admissionController.getReceiptPdf(req, res));
router.post("/:id/approve", requireAuth, (req, res) => admissionController.approve(req, res));
router.post("/:id/reject", requireAuth, (req, res) => admissionController.reject(req, res));

export default router;
