import { FLAT_CATEGORIES } from "../models/flatReview.model.js";

const MAX_COMMENT = 1000;

const toStars = (value) => {
    const n = Number(value);
    return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
};

// Checks the two-part review body: six room ratings, a room comment, the
// owner rating and an owner comment. Comments are optional.
export const validateStayReview = (req, res, next) => {
    const { ratings = {}, comment = "", ownerRating, ownerComment = "" } = req.body || {};
    const errors = [];

    const cleanRatings = {};
    for (const { key, label } of FLAT_CATEGORIES) {
        const stars = toStars(ratings[key]);
        if (stars === null) errors.push(`Rate ${label} from 1 to 5 stars`);
        else cleanRatings[key] = stars;
    }

    const cleanOwnerRating = toStars(ownerRating);
    if (cleanOwnerRating === null) errors.push("Rate the owner from 1 to 5 stars");

    const roomText = String(comment).trim();
    const ownerText = String(ownerComment).trim();
    if (roomText.length > MAX_COMMENT) errors.push(`The room review can be at most ${MAX_COMMENT} characters`);
    if (ownerText.length > MAX_COMMENT) errors.push(`The owner review can be at most ${MAX_COMMENT} characters`);

    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: errors[0], errors });
    }

    req.validatedReview = {
        ratings: cleanRatings,
        comment: roomText,
        ownerRating: cleanOwnerRating,
        ownerComment: ownerText
    };
    next();
};
