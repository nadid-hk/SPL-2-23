import { verifyOtp} from "../controllers/otp.controller.js";
import { generateOtp} from "../controllers/otp.controller.js";
import { Router } from "express";
const router = Router();
router.route("/generate-otp").post(generateOtp);
router.route("/verify-otp").post(verifyOtp);
export default router;