import { Router } from "express";
import { createNotification, listNotifications } from "../controllers/notificationController";
import { requireAuth, requireRole } from "../middleware/auth";

export const notificationsRouter = Router();

notificationsRouter.post("/", requireRole(["group_admin"]), createNotification);
notificationsRouter.get("/", requireAuth, listNotifications);
