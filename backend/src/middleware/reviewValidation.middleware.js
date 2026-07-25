export const validateReview = (req, res, next) => {
    const { homeRegisterId, reviewerName, rating, comment } = req.body;

    const errors = [];

    if (!homeRegisterId?.trim()) errors.push("homeRegisterId is required");
    if (!reviewerName?.trim()) errors.push("Reviewer name is required");

    const numericRating = Number(rating);
    if (rating === undefined || rating === null || rating === "" || isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        errors.push("Rating must be a number between 1 and 5");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors
        });
    }

    req.validatedReview = {
        homeRegisterId: homeRegisterId.trim(),
        reviewerName: reviewerName.trim(),
        rating: numericRating,
        comment: comment?.trim() || ""
    };

    next();
};