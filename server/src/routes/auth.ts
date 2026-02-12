import { Router } from "express";
import { adminLogin, memberLogin, logout, me } from "../controllers/authController";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

authRouter.post("/admin/login", adminLogin);
authRouter.post("/member/login", memberLogin);
authRouter.post("/logout", requireAuth, logout);
authRouter.get("/me", requireAuth, me);
