import "express-session";

export type SessionUser = {
  userId: string;
  groupId: string;
  role: "group_admin" | "member" | "platform_owner";
};

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

declare module "express-session" {
  interface SessionData {
    user?: SessionUser;
  }
}
