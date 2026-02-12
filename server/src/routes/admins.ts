import { Router } from "express";
import { getAdminMe, updateAdminMe, changeAdminPassword } from "../controllers/adminController";
import { requireRole } from "../middleware/auth";

export const adminsRouter = Router();

adminsRouter.get("/me", requireRole(["group_admin"]), getAdminMe);
adminsRouter.put("/me", requireRole(["group_admin"]), updateAdminMe);
adminsRouter.put("/me/password", requireRole(["group_admin"]), changeAdminPassword);