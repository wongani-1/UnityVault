import "dotenv/config";
import app from "./app";
import { env } from "./config/env";
import { seedData } from "./seed";

// Seed test data on startup for memory store only
if (env.dataStore === "memory") {
  seedData().catch(console.error);
}

app.listen(env.port, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`UnityVault API listening on :${env.port}`);
});
