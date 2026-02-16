import type { Request, Response } from "express";
import { container } from "../container";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";

export const listActiveSessions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const sessions = await container.sessionService.listActiveSessions(req.user.userId);

  res.json({ items: sessions });
});

export const revokeSession = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const { sessionId } = req.params;

  if (!sessionId) {
    throw new ApiError("sessionId is required", 400);
  }

  const session = await container.sessionService.getSession(sessionId);

  if (!session || session.userId !== req.user.userId) {
    throw new ApiError("Session not found or unauthorized", 404);
  }

  await container.sessionService.revokeSession(sessionId);

  res.json({ message: "Session revoked" });
});

export const revokeAllOtherSessions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const sessions = await container.sessionService.listActiveSessions(req.user.userId);

  // Revoke all except current session (if available from context)
  for (const session of sessions) {
    // You could add logic here to identify current session from headers if needed
    await container.sessionService.revokeSession(session.id);
  }

  res.json({ message: "All other sessions revoked" });
});

export const revokeSessionByDevice = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const { deviceName } = req.body as { deviceName: string };

  if (!deviceName) {
    throw new ApiError("deviceName is required", 400);
  }

  await container.sessionService.revokeSessionByDevice(req.user.userId, deviceName);

  res.json({ message: "Session revoked for device" });
});

export const getSessionInfo = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError("Unauthorized", 401);

  const { sessionId } = req.params;

  if (!sessionId) {
    throw new ApiError("sessionId is required", 400);
  }

  const session = await container.sessionService.getSession(sessionId);

  if (!session || session.userId !== req.user.userId) {
    throw new ApiError("Session not found or unauthorized", 404);
  }

  res.json(session);
});
