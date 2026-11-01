import mongoose from "mongoose";

// Tier two: the tenant's rating of the homeowner as a landlord. Grouped by
// ownerGroupId so it follows the person across every property they have
// linked, the same way a host rating does.
const ownerReviewSchema = new mongoose.Schema(
    {
        ownerGroupId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },
        homeRegister: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "HomeRegister",
            required: true
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true
        },
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
        rating: {
            type: Number,
            required: true,
            min: [1, "The owner rating must be between 1 and 5"],
            max: [5, "The owner rating must be between 1 and 5"],
            validate: {
                validator: Number.isInteger,
                message: "Ratings must be whole stars"
            }
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

export const OwnerReview = mongoose.model("OwnerReview", ownerReviewSchema);
