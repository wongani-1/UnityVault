const defaultCorsOrigins = [
  "http://localhost:8080",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://localhost:5173",
];

const configuredCorsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const corsOrigin = Array.from(
  new Set([
    ...(configuredCorsOrigins.length > 0 ? configuredCorsOrigins : defaultCorsOrigins),
    process.env.APP_BASE_URL?.trim() || "",
  ].filter(Boolean))
);

const dataStore =
  process.env.DATA_STORE ||
  (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? "supabase"
    : "memory");

const isProduction = process.env.NODE_ENV === "production";

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required in production");
}
if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required in production");
}

export const env = {
  port: Number(process.env.PORT || 4000),
  isProduction,
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
    sendgridApiKey: process.env.SENDGRID_API_KEY || "",
    from: process.env.FROM_EMAIL || "",
  },
  paychangu: {
    mockMode: process.env.PAYCHANGU_MOCK_MODE !== "false",
    apiToken: process.env.PAYCHANGU_API_TOKEN || "",
    apiUrl: process.env.PAYCHANGU_API_URL || "https://api.paychangu.com",
  },
};
