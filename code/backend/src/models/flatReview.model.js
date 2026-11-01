import mongoose from "mongoose";

// The six things students said matter most when choosing a room (see the
// requirement interviews). Order here is the display order everywhere.
export const FLAT_CATEGORIES = [
    { key: "cleanliness", label: "Cleanliness" },
    { key: "spaciousness", label: "Spaciousness" },
    { key: "location", label: "Location" },
    { key: "value", label: "Value for money" },
    { key: "utilities", label: "Utilities" },
    { key: "safety", label: "Safety" }
];

const score = {
    type: Number,
    required: true,
    min: [1, "Each rating must be between 1 and 5"],
    max: [5, "Each rating must be between 1 and 5"],
    validate: {
        validator: Number.isInteger,
        message: "Ratings must be whole stars"
    }
};

const ratingsShape = Object.fromEntries(FLAT_CATEGORIES.map(({ key }) => [key, score]));

// Tier one: the tenant's review of the room itself, attached to the listing.
const flatReviewSchema = new mongoose.Schema(
    {
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true,
            index: true
        },
        homeRegister: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "HomeRegister",
            required: true
        },
        // One review per stay; editing updates this same document.
        tenancy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenancy",
            required: true,
            unique: true
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        ratings: ratingsShape,
        // Mean of the six ratings, stored so listing cards can sort and show
        // it without recomputing.
        overall: {
            type: Number,
            required: true
        },
        comment: {
            type: String,
            trim: true,
            maxlength: [1000, "A review cannot be longer than 1000 characters"],
            default: ""
        }
    },
    { timestamps: true }
);

flatReviewSchema.pre("validate", function () {
    const values = FLAT_CATEGORIES.map(({ key }) => this.ratings?.[key]).filter((v) => typeof v === "number");
    if (values.length === FLAT_CATEGORIES.length) {
        this.overall = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
    }
});

export const FlatReview = mongoose.model("FlatReview", flatReviewSchema);
