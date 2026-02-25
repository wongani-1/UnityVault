import type { Request, Response } from "express";
import { container } from "../container";
import { asyncHandler } from "../utils/asyncHandler";
import { signToken } from "../utils/jwt";
import { ApiError } from "../utils/apiError";

export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, password, mode } = req.body as {
    identifier: string;
    password: string;
    mode?: "jwt" | "session" | "both";
  };

  const user = await container.authService.adminLogin({
    identifier,
    password,
  });

  // If 2FA is enabled, don't issue a full token — return a partial response
  if (user.requires2FA) {
    res.json({
      requires2FA: true,
      userId: user.userId,
      message: "2FA verification required",
    });
    return;
  }

  if (mode === "session" || mode === "both") {
    req.session.user = user;
  }

  const token = mode === "session" ? undefined : signToken(user);

  res.json({ user, token, mode: mode || "jwt" });
});

export const memberLogin = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, password, mode } = req.body as {
    identifier: string;
    password: string;
    mode?: "jwt" | "session" | "both";
  };

  const user = await container.authService.memberLogin({ identifier, password });

  // If 2FA is enabled, don't issue a full token — return a partial response
  if (user.requires2FA) {
    res.json({
      requires2FA: true,
      userId: user.userId,
      message: "2FA verification required",
    });
    return;
  }

  if (mode === "session" || mode === "both") {
    req.session.user = user;
  }

  const token = mode === "session" ? undefined : signToken(user);

  res.json({ user, token, mode: mode || "jwt" });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (!req.session) throw new ApiError("No session", 400);
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error:", err);
    }
    res.json({ status: "ok" });
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  res.json({ user: req.user });
});
