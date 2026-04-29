import axios from "axios";

async function clearFirestore() {
  const projectId = "demo-sesewa-ng";
  // Port 8080 matches the firestore configuration in your firebase.json
  const url = `http://127.0.0.1:8080/emulator/v1/projects/${projectId}/databases/(default)/documents`;

  console.log(`[CLEANUP] Clearing Firestore emulator data for project: ${projectId}`);
  try {
    await axios.delete(url);
    console.log("[CLEANUP] Firestore emulator cleared successfully.");
  } catch (error: any) {
    console.error("[CLEANUP] Failed to clear Firestore emulator:", error.response?.data || error.message);
    process.exit(1);
  }
}

clearFirestore();