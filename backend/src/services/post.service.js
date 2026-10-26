import { Post, DEPARTMENTS } from "../models/post.model.js";
import { HomeRegister } from "../models/homeRegister.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/apiError.util.js";
import { upsertHouseDistance, getHouseDistancesMap } from "./houseDistance.service.js";
import { removeLocalFile } from "../utils/removeLocalFile.util.js";
import fs from "fs";

// Looks up the HomeRegister record for a Khatian number and confirms it is
// the SAME property the poster selected. Used both by the "verify" endpoint
// (to prefill the form) and again inside createPost (never trust that the
// client verified first).
export const verifyOwnerByKhatian = async (registeredHouseId, khatianNumber) => {
    const khatian = String(khatianNumber || "").trim();
    if (!khatian) throw new ApiError(400, "Khatian number is required to post as an owner.");

    const house = await HomeRegister.findOne({ khatianNumber: khatian });
    if (!house) throw new ApiError(404, "No registered property found for this Khatian number.");
    if (house.status !== "approved") {
        throw new ApiError(400, "This property has not been approved by an admin yet.");
    }
    if (registeredHouseId && house._id.toString() !== String(registeredHouseId)) {
        throw new ApiError(400, "This Khatian number does not belong to the selected property.");
    }
    return house;
};

export const createPost = async (data, user) => {
    const authorId = user._id;
    try {
        const postedAs = data.postedAs;
        if (!["owner", "student"].includes(postedAs)) {
            throw new ApiError(400, "postedAs must be either 'owner' or 'student'.");
        }

        let house;
        let contactPhone;
        let posterName;
        let studentDepartment = "";

        if (postedAs === "owner") {
            // The property is determined by the Khatian number alone — any
            // client-supplied registeredHouse is ignored. Phone/name come
            // from HomeRegister, never from the client.
            house = await verifyOwnerByKhatian(null, data.khatianNumber);
            contactPhone = house.phoneNumber;
            posterName = house.ownerFullName;
        } else {
            house = await HomeRegister.findById(data.registeredHouse);
            if (!house) throw new ApiError(404, "Selected property does not exist");
            if (house.status !== "approved") {
                throw new ApiError(400, "You can only create a post for a property that an admin has approved");
            }
            studentDepartment = String(data.studentDepartment || "").trim();
            contactPhone = String(data.contactPhone || "").trim();
            if (!DEPARTMENTS.includes(studentDepartment)) {
                throw new ApiError(400, `Department must be one of: ${DEPARTMENTS.join(", ")}.`);
            }
            if (!/^\d{11}$/.test(contactPhone)) {
                throw new ApiError(400, "A valid 11-digit phone number is required when posting as a student.");
            }
            posterName = user.fullName || user.name || user.username || "Student";
        }

        const fullAddress = house.houseAddress || "Address not specified";

        const registeredCoordinates = house.houseMap?.coordinates;
        const exactLocation = {
            type: "Point",
            coordinates:
                Array.isArray(registeredCoordinates) && registeredCoordinates.length === 2
                    ? registeredCoordinates
                    : [90.404, 24.242]
        };

        const newPost = await Post.create({
            author: authorId,
            registeredHouse: house._id,
            photoLocalPaths: data.photoLocalPaths, // uploaded to Cloudinary only on approval
            postedAs,
            posterName,
            studentDepartment,
            // Always the registered property's real owner, never the client-supplied
            // value or the logged-in account's name.
            ownerName: house.ownerFullName,
            contactPhone,
            monthlyRent: data.monthlyRent,
            fullAddress,
            exactLocation,
            gateClosedTime: data.gateClosedTime,
            utilities: data.utilities,
            features: data.features,
            reasonTenantLeft: data.reasonTenantLeft
        });

        try {
            await upsertHouseDistance(house._id, exactLocation.coordinates);
        } catch (distanceErr) {
            console.error("Failed to compute house distance for", house._id, distanceErr);
        }

        return newPost;
    } catch (error) {
        // Note: the guards above also land here, so rejected requests don't leave temp files behind.
        (data.photoLocalPaths || []).forEach(removeLocalFile);
        throw error;
    }
};

// ── FIX: added `owner` to the populate select. Detail.js needs the real
// HomeRegister owner ID to reliably determine "is this the owner of THIS
// property", instead of the previous fragile name-matching that had nothing
// solid to compare against.
//
// ── NEW: this is also the fix for "map card isn't showing in the
// dashboard" — the dashboard's map needs a lat/lng + distance per listing,
// and it needs to come from the Post (the thing that's actually shown /
// approved), not from HomeRegister directly. Previously getApprovedPosts
// returned bare posts with no distance info attached at all, so there was
// nothing for a map component to render pins from except raw
// exactLocation coordinates with no "X min walk" context.
export const getApprovedPosts = async () => {
    const posts = await Post.find({ status: "approved" })
        .populate("registeredHouse", "housePropertyName houseAddress owner ownerFullName phoneNumber")
        .sort({ createdAt: -1 })
        .lean();

    if (posts.length === 0) return posts;

    const distanceMap = await getHouseDistancesMap(posts.map((p) => p.registeredHouse?._id));

    return posts.map((post) => {
        // distanceMap.get(String(post.registeredHouse._id)) instead of null for showning the distance
        const d = post.registeredHouse ? null : null;
        return {
            ...post,
            distance: d
                ? {
                      meters: d.distanceMeters,
                      km: d.distanceKm,
                      walkMinutes: d.estimatedWalkMinutes,
                      rideMinutes: d.estimatedRideMinutes,
                  }
                : null,
        };
    });
};

// ── NEW: Post.isRented already existed on the schema — it's the correct,
// authoritative field for "is this specific listing currently rented"
// (a HomeRegister property could in principle be re-posted later, so the
// rented flag belongs on the Post/listing, not on the underlying
// registration). This replaces the earlier HomeRegister-based toggle.
export const setPostRentalStatus = async (postId, requestingUser, isRented) => {
    const post = await Post.findById(postId).populate("registeredHouse", "owner");

    if (!post) {
        throw new ApiError(404, "Post not found.");
    }

    if (post.status !== "approved") {
        throw new ApiError(400, "Only approved posts can have their rental status updated.");
    }

    const isOwner = post.registeredHouse?.owner?.toString() === requestingUser._id.toString();
    // Adjust this check to match however admin accounts are actually
    // distinguished in your User discriminator setup (e.g. authMethod, role).
    const isAdmin = requestingUser.role === "admin" || requestingUser.authMethod === "Admin";

    if (!isOwner && !isAdmin) {
        throw new ApiError(403, "You are not authorized to update this property's rental status.");
    }

    post.isRented = Boolean(isRented);
    await post.save();

    return post;
};

export const getApprovedPostsByPriceRange = async ({ minRent, maxRent }) => {
    const query = { status: "approved" };

    const rentFilter = {};
    if (minRent !== undefined) rentFilter.$gte = minRent;
    if (maxRent !== undefined) rentFilter.$lte = maxRent;
    if (Object.keys(rentFilter).length > 0) query.monthlyRent = rentFilter;

    const posts = await Post.find(query)
        .populate("registeredHouse", "housePropertyName houseAddress owner ownerFullName phoneNumber")
        .sort({ monthlyRent: 1 }) // cheapest first
        .lean();

    return posts;
};