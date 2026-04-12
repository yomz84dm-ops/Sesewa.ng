import { onRequest } from "firebase-functions/v2/https";
import appPromise from "./server.js";

export const api = onRequest(async (req, res) => {
  const app = await appPromise;
  return app(req, res);
});
