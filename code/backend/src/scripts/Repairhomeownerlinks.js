/**
 * ONE-TIME MIGRATION — run this once after deploying the user.controller.js fix.
 *
 * Why this is needed:
 * Before the fix, logging in with a khatianNumber whose HomeRegister.owner
 * was empty resolved via `User.findById(undefined)`, which Mongoose/Mongo
 * silently turns into "return the first User in the whole collection".
 * Any two (or more) home owners who registered but hadn't logged in yet
 * ended up permanently sharing that same first User document — which is
 * why changing one owner's profile picture instantly changed it for the
 * other owner too (they were, underneath, the exact same account).
 *
 * This script finds every HomeRegister whose `owner` id is shared by more
 * than one HomeRegister document, and gives all but the first a brand new,
 * distinct User document (copying over their own name/phone from their own
 * HomeRegister record). The one profile picture that was shared can't be
 * un-mixed after the fact — affected owners will need to re-upload their
 * own photo once, but from that point on they'll be fully separate accounts.
 *
 * Usage:
 *   node scripts/repairHomeOwnerLinks.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";
import { HomeRegister } from "../models/homeRegister.model.js";

dotenv.config({ path: "./.env" });

async function run() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
        console.error("No MONGODB_URI/MONGO_URI found in environment. Aborting.");
        process.exit(1);
    }

    await mongoose.connect(uri);
    console.log("Connected to database.");

    const allHomeRegisters = await HomeRegister.find({ owner: { $ne: null } });

    const byOwner = new Map();
    for (const hr of allHomeRegisters) {
        const key = hr.owner.toString();
        if (!byOwner.has(key)) byOwner.set(key, []);
        byOwner.get(key).push(hr);
    }

    let separated = 0;

    for (const [ownerId, group] of byOwner.entries()) {
        if (group.length <= 1) continue;

        console.log(`Owner ${ownerId} is shared by ${group.length} HomeRegister records — splitting.`);

        // Keep the first one attached to the existing User document as-is.
        // Give every other one in the group a brand-new, distinct User.
        for (const hr of group.slice(1)) {
            const newUser = await User.create({
                name: hr.ownerFullName,
                phone: hr.phoneNumber,
                password: hr.password, // same placeholder pattern used at first login
            });

            hr.owner = newUser._id;
            await hr.save({ validateBeforeSave: false });

            separated++;
            console.log(`  -> HomeRegister ${hr._id} relinked to new User ${newUser._id}`);
        }
    }

    console.log("\nDone.");
    console.log(`  HomeRegister records relinked to a distinct new User: ${separated}`);
    if (separated > 0) {
        console.log(
            "  Note: any owner relinked above will need to re-upload their profile picture once, since the previously shared picture can't be attributed to a single original owner."
        );
    }

    await mongoose.disconnect();
}

run().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});