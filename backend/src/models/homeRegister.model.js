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
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        // NEW: groups multiple HomeRegister documents that belong to the
        // SAME real-world person, even though each property still has its
        // own separate login (own khatianNumber/password/owner id — that
        // part of the model is unchanged).
        //
        // - First-time registration: left unset by the client, and the
        //   default below makes it equal to the document's own _id, i.e.
        //   the property is its own group of one.
        // - "Register another property" flow: the server looks up the
        //   ownerGroupId of the property matching the previousKhatianNumber
        //   the user typed in, and passes THAT value in explicitly here
        //   (see homeRegister.service.js / resolveOwnerGroupId). The client
        //   never supplies this value directly — same trust boundary as
        //   the `owner` id fix above.
        //
        // This is what lets review.service.js pull a combined review
        // history across every property owned by the same person.
        ownerGroupId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            default: function () {
                return this._id;
            },
            index: true
        },

        // NEW: purely an audit trail — which previous Khatian number (if
        // any) the owner typed in to link this property to their existing
        // group. Not used for any lookups; ownerGroupId is the source of
        // truth. Useful for admin support / debugging "why are these two
        // properties linked".
        linkedViaKhatianNumber: {
            type: String,
            trim: true,
            default: null
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