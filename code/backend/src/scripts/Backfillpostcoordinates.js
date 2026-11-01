/**
 * ONE-TIME MIGRATION — run this once after deploying the post.service.js fix.
 *
 * Why this is needed:
 * Before the fix, EVERY Post was created with the hardcoded fallback
 * coordinates [90.404, 24.242] baked permanently into its `exactLocation`
 * field, because createPost() was reading the wrong field name off the
 * HomeRegister document. That fix only affects POSTS CREATED FROM NOW ON —
 * it does nothing for posts that already exist in the database, which is
 * why the map still shows the same [24.242, 90.404] pin for older listings.
 *
 * This script re-derives `exactLocation` for every existing Post from its
 * linked HomeRegister.houseMap.coordinates and updates it in place.
 *
 * Usage:
 *   node scripts/backfillPostCoordinates.js
 *
 * Make sure your .env (DB connection string, etc.) is set up the same way
 * your server normally loads it.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { Post } from "../models/post.model.js";
import { HomeRegister } from "../models/homeRegister.model.js";

dotenv.config({ path: "./.env" });

const FALLBACK_COORDINATES = [90.404, 24.242]; // [lng, lat] — the old hardcoded default

async function run() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
        console.error("No MONGODB_URI/MONGO_URI found in environment. Aborting.");
        process.exit(1);
    }

    await mongoose.connect(uri);
    console.log("Connected to database.");

    const posts = await Post.find({}).populate("registeredHouse", "houseMap");

    let updated = 0;
    let skippedNoHouse = 0;
    let skippedNoCoords = 0;
    let skippedAlreadyReal = 0;

    for (const post of posts) {
        const isFallback =
            Array.isArray(post.exactLocation?.coordinates) &&
            post.exactLocation.coordinates[0] === FALLBACK_COORDINATES[0] &&
            post.exactLocation.coordinates[1] === FALLBACK_COORDINATES[1];

        if (!isFallback) {
            skippedAlreadyReal++;
            continue;
        }

        const house = post.registeredHouse;
        if (!house) {
            skippedNoHouse++;
            continue;
        }

        const realCoordinates = house.houseMap?.coordinates;
        if (!Array.isArray(realCoordinates) || realCoordinates.length !== 2) {
            skippedNoCoords++;
            continue;
        }

        post.exactLocation = { type: "Point", coordinates: realCoordinates };
        await post.save();
        updated++;
        console.log(`Updated post ${post._id} -> [${realCoordinates}]`);
    }

    console.log("\nDone.");
    console.log(`  Updated:                    ${updated}`);
    console.log(`  Already had real coords:    ${skippedAlreadyReal}`);
    console.log(`  Skipped (no linked house):  ${skippedNoHouse}`);
    console.log(`  Skipped (house has no pin): ${skippedNoCoords}`);

    await mongoose.disconnect();
}

run().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});