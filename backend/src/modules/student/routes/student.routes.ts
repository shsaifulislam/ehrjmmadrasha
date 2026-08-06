import { Router } from "express";
import { studentController } from "../controllers/StudentController";
import { requireAuth } from "../../../middlewares/auth.middleware";

const router = Router();

router.use(requireAuth);

router.get("/stats", (req, res) => studentController.getStats(req, res));
router.get("/search", (req, res) => studentController.search(req, res));
router.get("/", (req, res) => studentController.getAll(req, res));
router.get("/:id", (req, res) => studentController.getById(req, res));
router.get("/:id/360", (req, res) => studentController.getStudent360(req, res));
router.post("/", (req, res) => studentController.create(req, res));
router.post("/:id/promote", (req, res) => studentController.promote(req, res));
router.post("/:id/transfer", (req, res) => studentController.transfer(req, res));
router.post("/:id/documents", (req, res) => studentController.addDocument(req, res));
router.delete("/documents/:docId", (req, res) => studentController.deleteDocument(req, res));

export default router;
