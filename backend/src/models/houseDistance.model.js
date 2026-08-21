import mongoose from "mongoose";

// One HouseDistance document per HomeRegister document. Kept separate (not
// embedded fields on HomeRegister) so it can be recomputed independently —
// e.g. if the IUT reference point or the calculation method ever changes,
// we can regenerate every HouseDistance without touching HomeRegister at all.
const houseDistanceSchema = new mongoose.Schema(
    {
        homeRegister: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "HomeRegister",
            required: true,
            unique: true,
            index: true,
        },

        // Meters, straight-line (Haversine) distance from the IUT gate.
        distanceMeters: {
            type: Number,
            required: true,
        },

        // Convenience field so the frontend doesn't have to divide by 1000
        // itself on every render — same number, just pre-rounded to 1dp km.
        distanceKm: {
            type: Number,
            required: true,
        },

        estimatedWalkMinutes: {
            type: Number,
            required: true,
        },

        estimatedRideMinutes: {
            type: Number,
            required: true,
        },

        // Which lat/lng the distance was computed against — lets us tell,
        // at a glance during support/debugging, whether a stale distance
        // doc still matches the IUT reference point currently in use.
        // 🐛 FIX: this default was [24.242, 90.404], which is nowhere near
        // the real IUT_GATE in constants.js (23.94862, 90.37935) — it looks
        // like a leftover placeholder from LocationMap's DEFAULT_CENTER.
        // Now kept in sync with constants.js at write time (see
        // houseDistance.service.js), this is just the schema-level fallback.
        referencePoint: {
            type: [Number], // [lat, lng]
            default: [23.94862, 90.37935],
        },

        calculatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

export const HouseDistance = mongoose.model("HouseDistance", houseDistanceSchema);