import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { SessionUser } from "../types/express";

export const signToken = (user: SessionUser) => {
  return jwt.sign(user, env.jwtSecret, { expiresIn: "8h" });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, env.jwtSecret) as SessionUser;
};
