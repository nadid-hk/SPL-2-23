import mongoose from "mongoose";

// Departments a student can post from. Shared with the validation middleware.
export const DEPARTMENTS = ["CSE", "EEE", "MPE", "CIVIL", "BTM"];

const postSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        registeredHouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "HomeRegister",
            required: [true, "Post must belong to a registered property"]
        },
         photoLocalPaths: {
            type: [String],
            default: [],
            validate: {
                validator: function (val) {
                    // A pending post must have its 2 temp files waiting for review.
                    return this.status !== "pending" || val.length === 2;
                },
                message: "You must upload exactly 2 photos for the listing."
            }
        },
       // Cloudinary photos: only filled in once an admin approves.
        photos: {
            type: [
                {
                    url: { type: String, required: true },
                    publicId: { type: String, required: true }
                }
            ],
            validate: {
                validator: function (val) {
                    return this.status !== "approved" || val.length === 2;
                },
                message: "An approved listing must have exactly 2 photos."
            }
        },
        // Who created this post: the property's owner (verified by Khatian
        // number) or a student (e.g. a departing tenant).
        postedAs: {
            type: String,
            enum: ["owner", "student"],
            required: [true, "Please specify whether you are posting as an owner or a student"],
            index: true
        },
        // Display name for the post card: owner's name for owner posts,
        // the student's account name for student posts.
        posterName: {
            type: String,
            trim: true,
            default: ""
        },
        // Only for student posts.
        studentDepartment: {
            type: String,
            trim: true,
            default: "",
            validate: {
                validator: function (val) {
                    return this.postedAs !== "student" || DEPARTMENTS.includes(val);
                },
                message: `Department must be one of: ${DEPARTMENTS.join(", ")}.`
            }
        },
        ownerName: {
            type: String,
            required: [true, "Owner name is required"],
            trim: true
        },
        // Owner posts: the owner's phone from HomeRegister.
        // Student posts: the student's own phone.
        contactPhone: {
            type: String,
            required: [true, "Contact phone number is required"],
            trim: true
        },
        monthlyRent: {
            type: Number,
            required: [true, "Monthly rent amount is required"],
            min: [0, "Rent cannot be negative"]
        },
        fullAddress: {
            type: String,
            required: [true, "Full address is required"],
            trim: true
        },
        exactLocation: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point"
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: [true, "Exact map location pin is required"]
            }
        },
        gateClosedTime: {
            type: String, 
            required: [true, "Gate closing time details are required"],
            trim: true
        },
        utilities: {
            type: [String],
            default: [] 
        },
        features: {
            type: [String],
            default: []
        },
        reasonTenantLeft: {
            type: String,
            trim: true,
            default: "Not specified"
        },

        // ── Availability Tracking Workflow ──
        isRented: {
            type: Boolean,
            default: false,
            index: true
        },

        // ── Admin approval workflow ──
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
            index: true
        },
        rejectionReason: {
            type: String,
            trim: true,
            default: ""
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        reviewedAt: {
            type: Date,
            default: null
        }
    },
    { 
        timestamps: true 
    }
);

postSchema.index({ exactLocation: "2dsphere" });

export const Post = mongoose.model("Post", postSchema);