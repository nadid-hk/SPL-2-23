import mongoose from "mongoose";
import bcrypt from "bcrypt";

const homeRegisterSchema = new mongoose.Schema(
    {
        // FIX: added `unique: true` as a safety net. Each HomeRegister
        // document is its own independent login identity (khatianNumber +
        // password), so `owner` should never legitimately be shared by two
        // documents. Without this constraint, a bug like the one in
        // homeRegister.controller.js (trusting a client-supplied ownerId)
        // could silently merge two owners' accounts with no error at all.
        // With it, MongoDB itself rejects the write instead of letting
        // that regression happen quietly again.
        //
        // NOTE: if you ever want one physical person to own multiple
        // properties under a single login, this constraint — and the
        // khatianNumber-per-login design in general — would need to change
        // together; they currently assume a 1:1 registration-to-owner model.
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        ownerFullName: {
            type: String,
            required: [true, "Owner's full name is required"],
            trim: true
        },
        phoneNumber: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true
        },
        khatianNumber: {
            type: String,
            required: [true, "Khatian number is required"],
            unique: true,
            trim: true
        },
        password: {
            type: String,
            required: [true, "Password is required"]
        },
        housePropertyName: {
            type: String,
            required: [true, "House/Property name is required"],
            trim: true
        },
        houseAddress: {
            type: String, 
            required: [true, "House address is required"],
            trim: true
        },
        housePicture: {
            url: {
                type: String,
                required: [true, "House picture URL is required"]
            },
            publicId: {
                type: String,
                required: true
            }
        },
        houseMap: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point"
            },
            coordinates: {
                type: [Number], 
                required: [true, "House location coordinates are required"]
            }
        },
        khatianCertificate: {
            url: {
                type: String,
                required: [true, "Khatian certificate image URL is required"]
            },
            publicId: {
                type: String,
                required: true
            }
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
            index: true
        },
        // NOTE: rental availability (isRented) intentionally does NOT live
        // here. It lives on Post.isRented instead — that field already
        // existed on the Post schema and is the correct source of truth
        // for "is this listing currently rented", since a HomeRegister
        // property is what gets posted, not what gets rented directly.
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

// Geospatial index
homeRegisterSchema.index({ houseMap: "2dsphere" });

// ── FIXED: Hashing password cleanly without next callback ──
homeRegisterSchema.pre("save", async function () {
    if (!this.isModified("password")) return; // Just return early if not modified
    
    this.password = await bcrypt.hash(this.password, 10);
    // No next() execution required here! Mongoose intercepts the promise resolution.
});

// Instance method to check password validity
homeRegisterSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

export const HomeRegister = mongoose.model("HomeRegister", homeRegisterSchema);