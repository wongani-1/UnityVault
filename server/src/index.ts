import "dotenv/config";
import app from "./app";
import { env } from "./config/env";

app.listen(env.port, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`UnityVault API listening on :${env.port}`);
});
