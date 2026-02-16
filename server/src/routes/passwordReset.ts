import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  requestPasswordReset,
  validateResetToken,
  resetPassword,
} from "../controllers/passwordResetController";

export const passwordResetRouter = Router();

passwordResetRouter.post("/request", requestPasswordReset);
passwordResetRouter.post("/validate", validateResetToken);
passwordResetRouter.post("/confirm", resetPassword);
