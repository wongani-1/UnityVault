import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status = err instanceof ApiError ? err.status : 500;
  const message = err instanceof ApiError ? err.message : "Server error";

  // Log the full error for debugging
  if (!(err instanceof ApiError)) {
    console.error("Internal server error:", err);
  }

  res.status(status).json({ error: message });
};
