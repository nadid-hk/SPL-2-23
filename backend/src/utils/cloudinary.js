import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
console.log("DEBUG -> Cloudinary API Key Loaded:", process.env.CLOUDINARY_API_KEY ? "YES" : "NO");
// Fixed: Removed single quotes so node evaluates the environment variables
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Fixed: Wrapped "auto" in quotes so it is passed as a string literal
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        // Delete the temporary file locally after a successful upload
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return response;
    } catch (error) {
        console.error("REAL CLOUDINARY ERROR:", error); 

        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};

export { uploadOnCloudinary };