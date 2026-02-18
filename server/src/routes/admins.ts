import { Router } from "express";
import { 
  getAdminMe, 
  updateAdminMe, 
  changeAdminPassword,
  recordSubscriptionPayment,
  checkSubscriptionStatus
} from "../controllers/adminController";
import { requireRole } from "../middleware/auth";

export const adminsRouter = Router();

adminsRouter.get("/me", requireRole(["group_admin"]), getAdminMe);
adminsRouter.put("/me", requireRole(["group_admin"]), updateAdminMe);
adminsRouter.put("/me/password", requireRole(["group_admin"]), changeAdminPassword);
adminsRouter.post("/me/subscription-payment", requireRole(["group_admin"]), recordSubscriptionPayment);
adminsRouter.get("/me/subscription-status", requireRole(["group_admin"]), checkSubscriptionStatus);