import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// In-memory storage for push subscriptions (you should use a database in production)
const subscriptions = new Map<string, PushSubscription>();

export const subscribe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  
  const subscription: PushSubscription = req.body;
  const userId = req.user.userId;

  if (!subscription || !subscription.endpoint) {
    throw new ApiError("Invalid subscription data", 400);
  }

  // Store subscription with user ID
  subscriptions.set(userId, subscription);

  res.json({ message: "Subscription saved successfully" });
});

export const unsubscribe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  
  const userId = req.user.userId;
  subscriptions.delete(userId);

  res.json({ message: "Unsubscribed successfully" });
});

// Utility function to send push notification (to be used by other services)
export async function sendPushNotification(
  userId: string,
  payload: {
    title: string;
    body: string;
    tag?: string;
    url?: string;
  }
) {
  const subscription = subscriptions.get(userId);
  if (!subscription) {
    console.log("No push subscription found for user");
    return;
  }

  // Note: In production, use web-push library for actual push notifications
  // npm install web-push
  // import webpush from 'web-push';
  // await webpush.sendNotification(subscription, JSON.stringify(payload));

  console.log("Would send push notification", {
    hasTag: Boolean(payload.tag),
    hasUrl: Boolean(payload.url),
  });
}
