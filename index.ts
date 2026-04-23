import { onRequest } from "firebase-functions/v2/https";
import appPromise from "./server.ts";

/**
 * EXPLICIT EXPORT FOR FIREBASE DETECTION
 * This is the ONLY way to ensure the 'api' endpoint is found.
 */
export const api = onRequest({ 
  region: "us-central1", 
  memory: "256MiB" 
}, async (request, response) => {
  const app = await appPromise;
  return app(request, response);
});
