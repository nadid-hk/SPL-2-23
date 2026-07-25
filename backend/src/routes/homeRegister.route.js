import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { validateHomeRegister } from "../middleware/homeRegisterValidation.middleware.js";
import { registerHome, getApprovedHouses } from "../controllers/homeRegister.controller.js";

const router = Router();

router.route("/home-register").post(
    upload.fields([
        { name: "housePicture", maxCount: 1 },
        { name: "khatianCertificate", maxCount: 1 }
    ]),
    validateHomeRegister,
    registerHome
);

// Feeds the "House / Property Name" <select> on the Post creation form —
// only admin-approved registrations show up here.
router.route("/home-register/approved").get(getApprovedHouses);

export default router;