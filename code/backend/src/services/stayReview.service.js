import mongoose from "mongoose";
import { Post } from "../models/post.model.js";
import { HomeRegister } from "../models/homeRegister.model.js";
import { Tenancy } from "../models/tenancy.model.js";
import { FlatReview, FLAT_CATEGORIES } from "../models/flatReview.model.js";
import { OwnerReview } from "../models/ownerReview.model.js";
import { ApiError } from "../utils/apiError.util.js";

const REVIEWER_FIELDS = "name picture";
const round1 = (n) => Math.round(n * 10) / 10;

const loadPost = async (postId) => {
    if (!mongoose.isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid listing id.");
    }
    const post = await Post.findById(postId).populate("registeredHouse", "ownerGroupId housePropertyName ownerFullName");
    if (!post) {
        throw new ApiError(404, "Post not found.");
    }
    return post;
};

const ownerGroupOf = (post) => post.registeredHouse?.ownerGroupId || post.registeredHouse?._id;

// Average overall score and review count for each listing, attached as
// `flatRating` so cards can show stars without a request per card.
export const attachFlatRatings = async (posts) => {
    if (!posts.length) return posts;

    const rows = await FlatReview.aggregate([
        { $match: { post: { $in: posts.map((p) => p._id) } } },
        { $group: { _id: "$post", overall: { $avg: "$overall" }, count: { $sum: 1 } } }
    ]);
    const byPost = new Map(rows.map((r) => [String(r._id), { overall: round1(r.overall), count: r.count }]));

    return posts.map((post) => ({ ...post, flatRating: byPost.get(String(post._id)) || null }));
};

const flatStats = async (postId) => {
    const categoryAverages = Object.fromEntries(
        FLAT_CATEGORIES.map(({ key }) => [key, { $avg: `$ratings.${key}` }])
    );
    const [row] = await FlatReview.aggregate([
        { $match: { post: new mongoose.Types.ObjectId(String(postId)) } },
        { $group: { _id: null, count: { $sum: 1 }, overall: { $avg: "$overall" }, ...categoryAverages } }
    ]);

    return {
        count: row?.count || 0,
        overall: row ? round1(row.overall) : 0,
        categories: FLAT_CATEGORIES.map(({ key, label }) => ({
            key,
            label,
            average: row ? round1(row[key]) : 0
        }))
    };
};

const ownerStats = async (ownerGroupId) => {
    const [row] = await OwnerReview.aggregate([
        { $match: { ownerGroupId } },
        { $group: { _id: null, count: { $sum: 1 }, average: { $avg: "$rating" } } }
    ]);
    const propertyCount = await HomeRegister.countDocuments({ ownerGroupId, status: "approved" });

    return {
        count: row?.count || 0,
        average: row ? round1(row.average) : 0,
        propertyCount: Math.max(propertyCount, 1)
    };
};

// Everything the listing page shows: the room's reviews and the owner's
// reviews from every property in their group.
export const getListingReviews = async (postId) => {
    const post = await loadPost(postId);
    const ownerGroupId = ownerGroupOf(post);

    const [flat, flatReviews, owner, ownerReviews] = await Promise.all([
        flatStats(post._id),
        FlatReview.find({ post: post._id })
            .populate("student", REVIEWER_FIELDS)
            .populate("tenancy", "startedAt endedAt status")
            .sort({ updatedAt: -1 })
            .lean(),
        ownerStats(ownerGroupId),
        OwnerReview.find({ ownerGroupId })
            .populate("student", REVIEWER_FIELDS)
            .populate("homeRegister", "housePropertyName")
            .populate("tenancy", "startedAt endedAt status")
            .sort({ updatedAt: -1 })
            .lean()
    ]);

    return {
        categories: FLAT_CATEGORIES,
        flat: { stats: flat, reviews: flatReviews },
        owner: {
            name: post.registeredHouse?.ownerFullName || "",
            stats: owner,
            reviews: ownerReviews
        }
    };
};

// The signed-in student's stay on this listing (if any) and their existing
// review, so the form knows whether to show and what to prefill.
export const getMyReviewState = async (postId, user) => {
    const post = await loadPost(postId);
    const tenancy = await Tenancy.findOne({ post: post._id, student: user._id }).sort({ startedAt: -1 }).lean();

    if (!tenancy) {
        return { canReview: false, tenancy: null, flatReview: null, ownerReview: null };
    }

    const [flatReview, ownerReview] = await Promise.all([
        FlatReview.findOne({ tenancy: tenancy._id }).lean(),
        OwnerReview.findOne({ tenancy: tenancy._id }).lean()
    ]);

    return {
        canReview: true,
        tenancy: { _id: tenancy._id, status: tenancy.status, startedAt: tenancy.startedAt, endedAt: tenancy.endedAt },
        flatReview,
        ownerReview
    };
};

// Creates or updates both parts of the tenant's review in one go.
export const saveMyReview = async (postId, user, { ratings, comment, ownerRating, ownerComment }) => {
    const post = await loadPost(postId);
    const tenancy = await Tenancy.findOne({ post: post._id, student: user._id }).sort({ startedAt: -1 });

    if (!tenancy) {
        throw new ApiError(403, "Only a tenant the owner has confirmed can review this listing.");
    }

    const flat = (await FlatReview.findOne({ tenancy: tenancy._id })) || new FlatReview({
        post: post._id,
        homeRegister: tenancy.homeRegister,
        tenancy: tenancy._id,
        student: user._id
    });
    flat.ratings = ratings;
    flat.comment = comment;

    const owner = (await OwnerReview.findOne({ tenancy: tenancy._id })) || new OwnerReview({
        ownerGroupId: tenancy.ownerGroupId,
        homeRegister: tenancy.homeRegister,
        post: post._id,
        tenancy: tenancy._id,
        student: user._id
    });
    owner.rating = ownerRating;
    owner.comment = ownerComment;

    // Validate both before saving either, so a bad owner rating can't leave
    // a half-saved review behind.
    await Promise.all([flat.validate(), owner.validate()]);
    await flat.save();
    await owner.save();

    return { flatReview: flat, ownerReview: owner };
};
