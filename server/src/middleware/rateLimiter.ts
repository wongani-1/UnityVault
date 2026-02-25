import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";

interface RateLimiterOptions {
  windowMs: number;
  max: number;
}

const stores = new Map<string, Map<string, { count: number; resetAt: number }>>();

export const rateLimiter = (opts: RateLimiterOptions) => {
  const storeKey = `${opts.windowMs}:${opts.max}`;
  if (!stores.has(storeKey)) {
    stores.set(storeKey, new Map());
  }
  const store = stores.get(storeKey)!;

  // Periodic cleanup to prevent memory leak
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key);
    }
  }, opts.windowMs).unref();

  return (req: Request, _res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();

    const entry = store.get(ip);
    if (!entry || entry.resetAt <= now) {
      store.set(ip, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > opts.max) {
      return next(new ApiError("Too many requests. Please try again later.", 429));
    }

    return next();
  };
};
