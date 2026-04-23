import { onRequest } from "firebase-functions/v2/https";
import appPromise from "./dist/server.js";

export const api = onRequest({ region: "us-central1", memory: "256MiB" }, async (req, res) => {
  const app = await appPromise;
  return app(req, res);
});
