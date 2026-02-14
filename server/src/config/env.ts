const corsOrigin = (process.env.CORS_ORIGIN || "http://localhost:8080,http://localhost:8081,http://localhost:8082,http://localhost:5173")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || "dev_jwt_secret",
  sessionSecret: process.env.SESSION_SECRET || "dev_session_secret",
  corsOrigin,
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:5173",
};
