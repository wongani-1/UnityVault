import { createId } from "../utils/id";
import type { Session, Role } from "../models/types";
import { ApiError } from "../utils/apiError";

// In-memory session store (should be replaced with database in production)
const sessions = new Map<string, Session>();

export class SessionService {
  async createSession(params: {
    userId: string;
    userRole: Role;
    deviceName: string;
    ipAddress: string;
    userAgent: string;
    expiryMinutes?: number;
  }): Promise<Session> {
    const {
      userId,
      userRole,
      deviceName,
      ipAddress,
      userAgent,
      expiryMinutes = 7 * 24 * 60, // 7 days default
    } = params;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryMinutes * 60000);

    const session: Session = {
      id: createId("sess"),
      userId,
      userRole,
      deviceName,
      ipAddress,
      userAgent,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
      lastActivityAt: now.toISOString(),
      isActive: true,
    };

    sessions.set(session.id, session);
    return session;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const session = sessions.get(sessionId);
    if (!session) return null;

    // Check if session has expired
    if (new Date(session.expiresAt) < new Date()) {
      sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  async listActiveSessions(userId: string): Promise<Session[]> {
    const userSessions: Session[] = [];

    for (const [, session] of sessions) {
      if (session.userId === userId && session.isActive) {
        // Check if expired
        if (new Date(session.expiresAt) > new Date()) {
          userSessions.push(session);
        } else {
          sessions.delete(session.id);
        }
      }
    }

    return userSessions;
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    const session = sessions.get(sessionId);
    if (session) {
      session.lastActivityAt = new Date().toISOString();
    }
  }

  async revokeSession(sessionId: string): Promise<void> {
    const session = sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      sessions.set(sessionId, session);
    }
  }

  async revokeAllSessions(userId: string): Promise<void> {
    for (const [key, session] of sessions) {
      if (session.userId === userId) {
        session.isActive = false;
        sessions.set(key, session);
      }
    }
  }

  async revokeSessionByDevice(userId: string, deviceName: string): Promise<void> {
    for (const [key, session] of sessions) {
      if (session.userId === userId && session.deviceName === deviceName) {
        session.isActive = false;
        sessions.set(key, session);
      }
    }
  }

  async revokeSessionByIp(userId: string, ipAddress: string): Promise<void> {
    for (const [key, session] of sessions) {
      if (session.userId === userId && session.ipAddress === ipAddress) {
        session.isActive = false;
        sessions.set(key, session);
      }
    }
  }

  cleanupExpiredSessions(): void {
    const now = new Date();
    const toDelete: string[] = [];

    for (const [key, session] of sessions) {
      if (new Date(session.expiresAt) < now) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => sessions.delete(key));
  }
}
