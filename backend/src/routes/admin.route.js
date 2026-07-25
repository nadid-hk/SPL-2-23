import { Router } from "express";
import {
    getPendingRegistrations,
    getPendingPostsHandler,
    getApprovedRegistrationsHandler,
    getListingsHandler,
    reviewRegistration,
    reviewPostHandler,
    getAllUsersHandler,
    getExpiredRankUsersHandler,
    deleteUserHandler
} from "../controllers/admin.controller.js";

const router = Router();

// TODO: once auth exists, protect every /admin/* route with an
// isAdmin/verifyJWT middleware here.

router.route("/admin/pending/registrations").get(getPendingRegistrations);
router.route("/admin/pending/posts").get(getPendingPostsHandler);
router.route("/admin/registrations/approved").get(getApprovedRegistrationsHandler);
router.route("/admin/listings").get(getListingsHandler);

router.route("/admin/registrations/:id/review").patch(reviewRegistration);
router.route("/admin/posts/:id/review").patch(reviewPostHandler);

// User account management (misconduct removal / expired rank-based accounts)
router.route("/admin/users").get(getAllUsersHandler);
router.route("/admin/users/expired-rank").get(getExpiredRankUsersHandler);
router.route("/admin/users/:id").delete(deleteUserHandler);

export default router;