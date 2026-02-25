import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { rateLimiter } from "../middleware/rateLimiter";
import {
  initiate2FA,
  verify2FA,
  disable2FA,
  getBackupCodes,
  regenerateBackupCodes,
  verify2FAToken,
} from "../controllers/twoFactorController";

const twoFactorLimiter = rateLimiter({ windowMs: 15 * 60_000, max: 10 });

export const twoFactorRouter = Router();

twoFactorRouter.post("/enable", requireAuth, initiate2FA);
twoFactorRouter.post("/verify", requireAuth, verify2FA);
twoFactorRouter.post("/disable", requireAuth, disable2FA);
twoFactorRouter.get("/backup-codes", requireAuth, getBackupCodes);
twoFactorRouter.post("/regenerate-backup-codes", requireAuth, regenerateBackupCodes);
twoFactorRouter.post("/verify-token", twoFactorLimiter, verify2FAToken);
