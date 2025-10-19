import admin from "firebase-admin";
import fs from "fs";

let db = null;

try {
  // Load the service account key (ensure correct relative path)
  const serviceAccount = JSON.parse(
    fs.readFileSync("./serviceAccountKey.json", "utf-8")
  );

  // Initialize Firebase app with credentials
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  // Get Firestore instance
  db = admin.firestore();
  console.log("✅ Firebase Firestore initialized successfully");
} catch (err) {
  console.error("❌ Failed to initialize Firebase:", err);
  db = null;
}

export default db;
