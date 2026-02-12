import { Router } from "express";
import { listNotifications } from "../controllers/notificationController";
import { requireAuth } from "../middleware/auth";

export const notificationsRouter = Router();

notificationsRouter.get("/", requireAuth, listNotifications);
