import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { ApiError } from "../utils/apiError";
import type { Role } from "../models/types";
import { container } from "../container";

const extractToken = (req: Request) => {
  const header = req.headers.authorization;
  if (!header) return undefined;
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return undefined;
  return token;
};

const loadUser = (req: Request) => {
  if (req.session?.user) return req.session.user;
  const token = extractToken(req);
  if (!token) return undefined;
  try {
    return verifyToken(token);
  } catch {
    throw new ApiError("Unauthorized", 401);
  }
};

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const user = loadUser(req);
  if (!user) return next(new ApiError("Unauthorized", 401));
  req.user = user;
  return next();
};

// Simple in-memory subscription status cache (TTL: 60s)
const subscriptionCache = new Map<string, { status: { isActive: boolean; subscriptionPaid?: boolean; planId?: string; trialEndsAt?: string }; expiresAt: number }>();

export const requireRole = (roles: Role[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = loadUser(req);
      if (!user) return next(new ApiError("Unauthorized", 401));
      if (!roles.includes(user.role)) return next(new ApiError("Forbidden", 403));

      const method = req.method.toUpperCase();
      const requestPath = req.originalUrl.split("?")[0] || "";
      const isSubscriptionExemptRoute =
        user.role === "group_admin" &&
        ((method === "GET" && requestPath === "/api/admins/me/subscription-status") ||
          (method === "POST" && requestPath === "/api/admins/me/subscription-payment"));

      if (user.role === "group_admin" && !isSubscriptionExemptRoute) {
        // Check cached subscription status first
        const cached = subscriptionCache.get(user.userId);
        let subscription: { isActive: boolean; subscriptionPaid?: boolean; planId?: string; trialEndsAt?: string };
        if (cached && cached.expiresAt > Date.now()) {
          subscription = cached.status;
        } else {
          subscription = await container.adminService.getSubscriptionStatus(user.userId);
          subscriptionCache.set(user.userId, { status: subscription, expiresAt: Date.now() + 60_000 });
        }

        if (!subscription.isActive) {
          if (!subscription.subscriptionPaid && subscription.planId === "starter" && subscription.trialEndsAt) {
            return next(
              new ApiError(
                "Your 14-day Starter trial has ended. Please choose a paid subscription plan to continue.",
                403
              )
            );
          }

          return next(
            new ApiError(
              "Subscription required. Please pay or renew your subscription to continue.",
              403
            )
          );
        }
      }

      req.user = user;
      return next();
    } catch (error) {
      return next(error as Error);
    }
  };
};
