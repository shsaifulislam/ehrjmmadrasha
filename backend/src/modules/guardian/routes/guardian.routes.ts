import { Router } from "express";
import { GuardianController } from "../controllers/GuardianController";
import { requireAuth } from "../../../middlewares/auth.middleware";

const router = Router();

router.use(requireAuth);

router.post("/", GuardianController.createGuardian);
router.get("/", GuardianController.listGuardians);
router.get("/:id", GuardianController.getGuardianById);
router.get("/:id/360", GuardianController.getGuardian360);
router.put("/:id", GuardianController.updateGuardian);
router.post("/:id/link-ward", GuardianController.linkWard);
router.delete("/unlink-ward/:studentId", GuardianController.unlinkWard);
router.delete("/:id", GuardianController.deleteGuardian);

export default router;
