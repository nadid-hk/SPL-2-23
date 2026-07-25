import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { updateUserProfileService } from "../services/profile.service.js";

export const handleProfileUpdate = asyncHandler(async (req, res) => {
    const updatedProfile = await updateUserProfileService(
        req.user._id,
        req.body,
        req.file,
        req.cleanMobile
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedProfile, "Profile has been successfully updated"));
});