import { Router } from "express";
import { validateReview } from "../middleware/reviewValidation.middleware.js";
import { addReview, getPropertyReviews } from "../controllers/review.controller.js";

const router = Router();

router.route("/reviews").post(validateReview, addReview);
router.route("/reviews/:homeRegisterId").get(getPropertyReviews);

export default router;