import * as admin from "firebase-admin";

// Explicitly point to the emulator port defined in firebase.json
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: "demo-sesewa-ng",
    });
}

const db = admin.firestore();

async function seedData() {
    console.log("Seeding Firestore Emulator...");

    // Seed a test user for Paystack/Credits logic
    const testUser = {
        uid: "test-user",
        email: "test@example.com",
        role: "user",
        credits: 0,
        plan: "basic"
    };

    await db.collection("users").doc(testUser.uid).set(testUser);
    console.log(`- Created user: ${testUser.email}`);

    // Seed a dummy handyman
    await db.collection("handymen").doc("test-handyman").set({
        userId: "handyman-uid",
        name: "Expert Plumber",
        verified: true,
        rating: 5,
        isFeatured: true
    });
    console.log("- Created test handyman");

    console.log("Seeding complete.");
}

seedData()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Seeding failed:", err);
        process.exit(1);
    });