import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { validateHomeRegister } from "../middleware/homeRegisterValidation.middleware.js";
import { registerHome, getApprovedHouses, lookupOwnerByKhatian } from "../controllers/homeRegister.controller.js";

const router = Router();

router.route("/home-register").post(
    upload.fields([
        { name: "housePicture", maxCount: 1 },
        { name: "khatianCertificate", maxCount: 1 }
    ]),
    validateHomeRegister,
    registerHome
);

// NEW: GET /api/home-register/lookup/:khatianNumber
// Powers the "Register another property" autofill step — no file upload,
// no auth, just a khatianNumber -> { ownerFullName, phoneNumber, ... } read.
router.route("/home-register/lookup/:khatianNumber").get(lookupOwnerByKhatian);

// Feeds the "House / Property Name" <select> on the Post creation form —
// only admin-approved registrations show up here.
router.route("/home-register/approved").get(getApprovedHouses);

export default router;