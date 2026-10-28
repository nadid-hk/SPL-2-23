import multer from "multer";
import path from "path";
import fs from "fs";
import { ApiError } from "../utils/apiError.util.js";

// Not under public/, so express.static can never serve these files.
export const PENDING_UPLOAD_DIR = path.resolve("private", "pending-uploads");
fs.mkdirSync(PENDING_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, PENDING_UPLOAD_DIR),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
});

// Files now persist on disk until review, so restrict what can be stored.
const fileFilter = (req, file, cb) => {
    const ok = file.mimetype.startsWith("image/") || file.mimetype === "application/pdf";
    cb(ok ? null : new ApiError(400, "Only image or PDF files are allowed"), ok);
};

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB per file
});