import { Post } from "../models/post.model.js";
import { HomeRegister } from "../models/homeRegister.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/apiError.util.js";
import { upsertHouseDistance, getHouseDistancesMap } from "./houseDistance.service.js";
import fs from "fs";

export const createPost = async (data, authorId) => {
    // Guard: the selected house must exist AND already be admin-approved.
    const house = await HomeRegister.findById(data.registeredHouse);
    if (!house) throw new ApiError(404, "Selected property does not exist");
    if (house.status !== "approved") {
        throw new ApiError(400, "You can only create a post for a property that an admin has approved");
    }

    let uploadedPhotos = [];

    try {
        for (const localPath of data.photoLocalPaths) {
            const result = await uploadOnCloudinary(localPath);
            if (!result) throw new Error("Photo upload execution failed.");
            uploadedPhotos.push({ url: result.secure_url, publicId: result.public_id });
        }

        data.photoLocalPaths.forEach((p) => {
            if (fs.existsSync(p)) fs.unlinkSync(p);
        });

        // Fetch properties directly from the pre-existing HomeRegister document
        const fullAddress = house.houseAddress || "Address not specified";

        // ── FIX: HomeRegister stores its geo-point under `houseMap.coordinates`
        // — it has no `exactLocation` or top-level `coordinates` field at all
        // (those names only exist on the Post schema). The old code read the
        // wrong field names here, so `house.exactLocation` and
        // `house.coordinates` were always undefined and every post silently
        // got the hardcoded fallback baked in permanently at creation time.
        const registeredCoordinates = house.houseMap?.coordinates;
        const exactLocation = {
            type: "Point",
            coordinates:
                Array.isArray(registeredCoordinates) && registeredCoordinates.length === 2
                    ? registeredCoordinates // real coordinates from the registration
                    : [90.404, 24.242] // fallback ONLY if none were ever saved
        };

        const newPost = await Post.create({
            author: authorId,
            registeredHouse: data.registeredHouse,
            photos: uploadedPhotos,
            ownerName: data.ownerName,
            contactPhone: data.contactPhone,
            monthlyRent: data.monthlyRent,
            fullAddress,               // Saved from database
            exactLocation,             // Saved from database
            gateClosedTime: data.gateClosedTime,
            utilities: data.utilities,
            features: data.features,
            reasonTenantLeft: data.reasonTenantLeft
        });

        // ── NEW: compute + persist the distance-from-IUT-gate the moment the
        // pin coordinates are known, instead of computing it on every read.
        // This is what feeds the map card's price pins + "12 min walk" text
        // on the dashboard. It's keyed to the HomeRegister (see
        // houseDistance.service.js for why), and failing here should never
        // block the post itself from being created — if it errors we log and
        // move on; the dashboard just won't show a distance for that pin
        // until it's recomputed.
        try {
            await upsertHouseDistance(data.registeredHouse, exactLocation.coordinates);
        } catch (distanceErr) {
            console.error("Failed to compute house distance for", data.registeredHouse, distanceErr);
        }

        return newPost;
    } catch (error) {
        data.photoLocalPaths.forEach((p) => {
            if (fs.existsSync(p)) fs.unlinkSync(p);
        });
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
        .populate("registeredHouse", "housePropertyName houseAddress owner")
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