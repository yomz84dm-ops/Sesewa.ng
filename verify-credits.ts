import * as admin from "firebase-admin";

// Ensure we target the local Firestore emulator
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: "demo-sesewa-ng",
    });
}

const db = admin.firestore();

async function verify() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error("Usage: npm run verify-credits -- <userId> <expectedCredits>");
        process.exit(1);
    }

    const userId = args[0];
    const expectedCredits = parseInt(args[1], 10);

    console.log(`[VERIFY] Validating credits for user: ${userId}`);
    try {
        const doc = await db.collection("users").doc(userId).get();
        if (!doc.exists) {
            console.error(`[VERIFY] Error: Document for ${userId} does not exist.`);
            process.exit(1);
        }

        const actual = doc.data()?.credits ?? 0;
        if (actual === expectedCredits) {
            console.log(`[VERIFY] SUCCESS: Found ${actual} credits as expected.`);
            process.exit(0);
        } else {
            console.error(`[VERIFY] FAILED: Expected ${expectedCredits}, but found ${actual}.`);
            process.exit(1);
        }
    } catch (e) {
        console.error("[VERIFY] Unexpected Error:", e);
        process.exit(1);
    }
}

verify();