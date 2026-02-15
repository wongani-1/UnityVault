import "dotenv/config";
import app from "./app";
import { env } from "./config/env";
import { seedData } from "./seed";

// Seed test data on startup
seedData().catch(console.error);

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`UnityVault API listening on :${env.port}`);
});
