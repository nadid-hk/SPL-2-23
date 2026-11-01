import fs from "fs";

export const removeLocalFile = (filePath) => {
     try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log("[removeLocalFile] deleted:", filePath);
        } else {
            console.warn("[removeLocalFile] file not found:", filePath);
        }
    } catch (err) {
        console.error("[removeLocalFile] failed:", filePath, err.message);
    }
};