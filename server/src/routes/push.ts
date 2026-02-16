import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as pushController from "../controllers/pushNotificationController";

export const pushRoutes = Router();

// All push notification routes require authentication
pushRoutes.use(requireAuth);

// Subscribe to push notifications
pushRoutes.post("/subscribe", pushController.subscribe);

// Unsubscribe from push notifications
pushRoutes.post("/unsubscribe", pushController.unsubscribe);
