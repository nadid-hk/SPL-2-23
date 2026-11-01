import mongoose from "mongoose";

// A confirmed stay: the property owner marked a listing Rented and named the
// student who is renting it. This is the proof-of-stay behind reviews — only
// a student with a Tenancy for a listing can review that listing and its
// owner. Marking the listing Available again ends the tenancy, but the
// record stays so the tenant can still write (or edit) their review.
const tenancySchema = new mongoose.Schema(
    {
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true
        },
        homeRegister: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "HomeRegister",
            required: true
        },
        // Copied from the property so owner ratings can be grouped across all
        // of the same person's linked properties without an extra lookup.
        ownerGroupId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        confirmedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            enum: ["active", "ended"],
            default: "active"
        },
        startedAt: {
            type: Date,
            default: Date.now
        },
        endedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

// A listing can have only one tenant at a time. Named explicitly so it can't
// clash with an auto-named plain index on the same key.
tenancySchema.index(
    { post: 1 },
    { name: "one_active_tenancy_per_post", unique: true, partialFilterExpression: { status: "active" } }
);
// Lookups: "this student's stay on this listing" and "all stays of a listing".
tenancySchema.index({ post: 1, student: 1, startedAt: -1 });

export const Tenancy = mongoose.model("Tenancy", tenancySchema);
