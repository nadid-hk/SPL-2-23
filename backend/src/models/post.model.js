import mongoose from "mongoose";

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
        photos: {
            type: [
                {
                    url: { type: String, required: true },
                    publicId: { type: String, required: true }
                }
            ],
            validate: {
                validator: function (val) {
                    return val.length === 2;
                },
                message: "You must upload exactly 2 photos for the listing."
            }
        },
        ownerName: {
            type: String,
            required: [true, "Owner name is required"],
            trim: true
        },
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