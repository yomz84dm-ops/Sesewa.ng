const { onRequest } = require("firebase-functions/v2/https");
const appPromise = require("./app.js").default;

exports.api = onRequest({ 
  region: "us-central1", 
  memory: "256MiB" 
}, async (request, response) => {
  try {
    const app = await appPromise;
    return app(request, response);
  } catch (err) {
    console.error("Function load error:", err);
    response.status(500).send("Internal Server Error");
  }
});
