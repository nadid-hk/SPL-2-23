import express from "express";
import { filterPosts } from "../controllers/postFilter.controller.js";

const router = express.Router();

router.get("/", filterPosts);

export default router;