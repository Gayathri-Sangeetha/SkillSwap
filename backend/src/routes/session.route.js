import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  requestSession,
  getMySessions,
  getSessionById,
  confirmSession,
  startSession,
  completeSession,
  cancelSession,
  rateSession,
  getUpcomingSessions,
} from "../controllers/session.controller.js";

const router = express.Router();


router.use(protectRoute);


router.get("/", getMySessions);


router.get("/upcoming", getUpcomingSessions);


router.get("/:id", getSessionById);


router.post("/request", requestSession);


router.put("/:id/confirm", confirmSession);


router.put("/:id/start", startSession);


router.put("/:id/complete", completeSession);


router.put("/:id/cancel", cancelSession);

router.post("/:id/rate", rateSession);

export default router;