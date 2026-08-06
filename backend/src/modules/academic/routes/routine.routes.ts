import { Router } from "express";
import { RoutineController } from "../controllers/routine.controller";
import { requireAuth } from "../../../middlewares/auth.middleware";

const router = Router();

router.use(requireAuth);

router.post("/", RoutineController.assignSlot);
router.get("/class/:classId", RoutineController.getClassRoutine);
router.delete("/:id", RoutineController.deleteSlot);

export default router;
