import { Router } from "express";
import { adminLogin, memberLogin, logout, me } from "../controllers/authController";
import { requireAuth } from "../middleware/auth";
import { rateLimiter } from "../middleware/rateLimiter";

const authLimiter = rateLimiter({ windowMs: 15 * 60_000, max: 15 });

export const authRouter = Router();

authRouter.post("/admin/login", authLimiter, adminLogin);
authRouter.post("/member/login", authLimiter, memberLogin);
authRouter.post("/logout", requireAuth, logout);
authRouter.get("/me", requireAuth, me);
