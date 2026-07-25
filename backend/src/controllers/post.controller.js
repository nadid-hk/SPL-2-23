import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.util.js";
import { createPost, getApprovedPosts } from "../services/post.service.js";
import { setPostRentalStatus } from "../services/post.service.js";

// 🐛 Same bug class as homeRegister.controller.js: this trusted a raw
// `authorId` from the request body. Unlike home registration, whoever is
// creating a Post IS already logged in (a student posting a listing), so
// there's no excuse to take this from the client at all — it should come
// from the authenticated session (`req.user`), which requires `verifyJWT`
// to run on this route (see post.route.js).
export const createPostHandler = asyncHandler(async (req, res) => {
    const authorId = req.user._id;

    const post = await createPost(req.validatedData, authorId);

    return res
        .status(201)
        .json(new ApiResponse(201, post, "Post submitted successfully. It is now pending admin approval."));
});

// GET /api/posts/approved — public/student-facing listings dashboard
export const getListings = asyncHandler(async (req, res) => {
    const posts = await getApprovedPosts();
    return res.status(200).json(new ApiResponse(200, posts, "Approved listings fetched"));
});

// PATCH /api/posts/:id/rental-status
export const updatePostRentalStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isRented } = req.body;
 
    if (typeof isRented !== "boolean") {
        throw new ApiError(400, "isRented must be a boolean (true or false).");
    }
 
    const updated = await setPostRentalStatus(id, req.user, isRented);
 
    return res
        .status(200)
        .json(new ApiResponse(200, updated, `Property marked as ${isRented ? "Rented" : "Available"}.`));
});