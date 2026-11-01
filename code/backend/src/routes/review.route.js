import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { validateStayReview } from "../middleware/reviewValidation.middleware.js";
import {
    getReviewsForListing,
    getMyReview,
    putMyReview,
    listTenantCandidates
} from "../controllers/review.controller.js";

const router = Router();

// Two-tier reviews (room + owner). Only a tenant the owner confirmed can
// write one; see services/tenancy.service.js.
router.route("/posts/:id/reviews").get(getReviewsForListing);
router
    .route("/posts/:id/reviews/me")
    .get(verifyJWT, getMyReview)
    .put(verifyJWT, validateStayReview, putMyReview);
router.route("/posts/:id/tenant-candidates").get(verifyJWT, listTenantCandidates);

export default router;
