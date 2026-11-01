import mongoose from "mongoose";
import { HomeRegister } from "../models/homeRegister.model.js"; // adjust path to your project

/**
 * GET /home-register/:id/owner-info
 *
 * Returns the REAL owner of a registered property (HomeRegister.ownerFullName),
 * as opposed to whichever logged-in account happened to create the Post.
 *
 * Only approved properties are exposed, and only the fields a listing page
 * actually needs — no phone, khatian number, password hash, etc.
 */
export const getPropertyOwnerInfo = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid property id." });
        }

        const house = await HomeRegister.findOne({ _id: id, status: "approved" })
            .select("ownerFullName housePropertyName")
            .lean();

        if (!house) {
            return res.status(404).json({ success: false, message: "Property not found." });
        }

        return res.status(200).json({
            success: true,
            data: {
                homeRegisterId: house._id,
                ownerFullName: house.ownerFullName,
                housePropertyName: house.housePropertyName
            }
        });
    } catch (error) {
        console.error("getPropertyOwnerInfo error:", error);
        return res.status(500).json({ success: false, message: "Failed to load owner information." });
    }
};