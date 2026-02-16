import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  listActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
  revokeSessionByDevice,
  getSessionInfo,
} from "../controllers/sessionController";

export const sessionsRouter = Router();

sessionsRouter.get("/", requireAuth, listActiveSessions);
sessionsRouter.get("/:sessionId", requireAuth, getSessionInfo);
sessionsRouter.delete("/:sessionId", requireAuth, revokeSession);
sessionsRouter.post("/revoke-all", requireAuth, revokeAllOtherSessions);
sessionsRouter.post("/revoke-device", requireAuth, revokeSessionByDevice);
