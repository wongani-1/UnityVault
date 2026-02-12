import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { ApiError } from "../utils/apiError";
import type { Role } from "../models/types";

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

export const requireRole = (roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = loadUser(req);
    if (!user) return next(new ApiError("Unauthorized", 401));
    if (!roles.includes(user.role)) return next(new ApiError("Forbidden", 403));
    req.user = user;
    return next();
  };
};
