import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { validatePost } from "../middleware/postValidation.middleware.js";
import { createPostHandler, getListings } from "../controllers/post.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { updatePostRentalStatus } from "../controllers/post.controller.js";

const router = Router();

router.route("/posts").post(
    verifyJWT,
    upload.fields([{ name: "photos", maxCount: 2 }]),
    validatePost,
    createPostHandler
);

router.route("/posts/approved").get(getListings);
router.route("/posts/:id/rental-status").patch(verifyJWT, updatePostRentalStatus);


export default router;