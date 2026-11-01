// One-off migration: run this ONCE after deploying the ownerGroupId schema
// change, so existing HomeRegister documents (created before this feature
// existed) each get their own ownerGroupId = their own _id — exactly what
// the schema `default` does automatically for brand new documents.
//
// This does NOT run as part of the server (not wired into app.js/index.js).
// It's a standalone script you run manually, once, from your terminal.
//
// Safe to re-run — it only touches documents that are still missing the
// field, so running it twice by accident does nothing on the second run.
//
// Usage (from your backend project root, same place you run `node index.js`):
//   node scripts/migrateOwnerGroupId.js

import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../db/index.db.js";
import { HomeRegister } from "../models/homeRegister.model.js";

dotenv.config({
    path: "./.env"
});

async function run() {
    await connectDB(); // same connection helper index.js uses
    console.log("Connected. Backfilling ownerGroupId...");

    const missing = await HomeRegister.find({ ownerGroupId: { $exists: false } }).select("_id");
    console.log(`Found ${missing.length} document(s) missing ownerGroupId.`);

    let updated = 0;
    for (const doc of missing) {
        await HomeRegister.updateOne(
            { _id: doc._id },
            { $set: { ownerGroupId: doc._id } }
        );
        updated += 1;
    }

    console.log(`Done. Updated ${updated} document(s).`);
    await mongoose.connection.close();
    process.exit(0);
}

run().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});