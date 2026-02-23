const corsOrigin = (process.env.CORS_ORIGIN || "http://localhost:8080,http://localhost:8081,http://localhost:8082,http://localhost:5173")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const dataStore =
  process.env.DATA_STORE ||
  (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? "supabase"
    : "memory");

export const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || "dev_jwt_secret",
  sessionSecret: process.env.SESSION_SECRET || "dev_session_secret",
  corsOrigin,
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:8080",
  dataStore,
  supabase: {
    url: process.env.SUPABASE_URL || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },
  email: {
    user: process.env.GMAIL_USER || "",
    pass: process.env.GMAIL_PASS || "",
  },
  paychangu: {
    mockMode: process.env.PAYCHANGU_MOCK_MODE !== "false",
    apiToken: process.env.PAYCHANGU_API_TOKEN || "",
    apiUrl: process.env.PAYCHANGU_API_URL || "https://api.paychangu.com",
  },
};
