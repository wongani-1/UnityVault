import { Router } from "express";
import {
  requestPasswordReset,
  validateResetToken,
  resetPassword,
} from "../controllers/passwordResetController";
import { rateLimiter } from "../middleware/rateLimiter";

const resetLimiter = rateLimiter({ windowMs: 15 * 60_000, max: 5 });

export const passwordResetRouter = Router();

passwordResetRouter.post("/request", resetLimiter, requestPasswordReset);
passwordResetRouter.post("/validate", resetLimiter, validateResetToken);
passwordResetRouter.post("/confirm", resetLimiter, resetPassword);
