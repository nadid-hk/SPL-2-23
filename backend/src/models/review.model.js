import mongoose from "mongoose";

// A review is scoped to a single HomeRegister property (identified by its
// khatianNumber), never to an owner directly. That's a deliberate product
// decision: when an owner registers a second property, the new property
// starts with a clean review history — it does not inherit ratings earned
// by their older property. See homeRegister.service.js /
// getReviewStatsForProperty for how this is surfaced during registration.
const reviewSchema = new mongoose.Schema(
    {
        homeRegister: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "HomeRegister",
            required: true,
            index: true
        },
        reviewerName: {
            type: String,
            required: [true, "Reviewer name is required"],
            trim: true
        },
        rating: {
            type: Number,
            required: [true, "Rating is required"],
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating cannot be more than 5"]
        },
        comment: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

export const Review = mongoose.model("Review", reviewSchema);