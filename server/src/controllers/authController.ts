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

  if (mode === "session" || mode === "both") {
    req.session.user = user;
  }

  const token = mode === "session" ? undefined : signToken(user);

  res.json({ user, token, mode: mode || "jwt" });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (!req.session) throw new ApiError("No session", 400);
  req.session.destroy(() => {
    res.json({ status: "ok" });
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);
  res.json({ user: req.user });
});
