import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  initiate2FA,
  verify2FA,
  disable2FA,
  getBackupCodes,
  regenerateBackupCodes,
  verify2FAToken,
} from "../controllers/twoFactorController";

export const twoFactorRouter = Router();

twoFactorRouter.post("/enable", requireAuth, initiate2FA);
twoFactorRouter.post("/verify", requireAuth, verify2FA);
twoFactorRouter.post("/disable", requireAuth, disable2FA);
twoFactorRouter.get("/backup-codes", requireAuth, getBackupCodes);
twoFactorRouter.post("/regenerate-backup-codes", requireAuth, regenerateBackupCodes);
twoFactorRouter.post("/verify-token", verify2FAToken);
