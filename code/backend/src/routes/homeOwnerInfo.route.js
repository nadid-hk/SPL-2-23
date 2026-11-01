import { Router } from "express";
import { getPropertyOwnerInfo } from "../controllers/homeOwnerInfo.controller.js"; 
 
const router = Router();

router.get("/:id/owner-info", getPropertyOwnerInfo);
 
export default router;