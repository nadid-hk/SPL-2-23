import { Post } from "../models/post.model.js";
import { attachFlatRatings } from "../services/stayReview.service.js";

// Whitelists: must match the values the Dashboard sends (and what Post stores).
const ALLOWED_UTILITIES = [
  "24/7 Electricity", "IPS", "Lift", "Security Guard", "Gas", "Water Bill Included",
];
const ALLOWED_FEATURES = [
  "Oven", "Fridge", "Washing Machine", "AC", "Balcony",
  "Attached Bath", "Shared Kitchen", "Wi-Fi", "Rooftop Access", "Generator",
];

// "a,b,c" -> ["a","b","c"]. Forces a string so ?utilities[$ne]=x can't inject operators.
const toList = (v) =>
  v === undefined ? [] : String(v).split(",").map((s) => s.trim()).filter(Boolean);

export const filterPosts = async (req, res) => {
  try {
    const utilities = toList(req.query.utilities);
    const features = toList(req.query.features);

    const badUtil = utilities.filter((u) => !ALLOWED_UTILITIES.includes(u));
    const badFeat = features.filter((f) => !ALLOWED_FEATURES.includes(f));
    if (badUtil.length || badFeat.length) {
      return res.status(400).json({
        success: false,
        message: `Invalid filter value(s): ${[...badUtil, ...badFeat].join(", ")}`,
      });
    }

    const query = { status: "approved" };

    // Optional rent range (keeps the existing price filter working in the same call)
    const { minRent, maxRent } = req.query;
    const min = minRent !== undefined && minRent !== "" ? Number(minRent) : null;
    const max = maxRent !== undefined && maxRent !== "" ? Number(maxRent) : null;
    if ((min !== null && (Number.isNaN(min) || min < 0)) ||
        (max !== null && (Number.isNaN(max) || max < 0))) {
      return res.status(400).json({ success: false, message: "Rent values must be non-negative numbers." });
    }
    if (min !== null && max !== null && min > max) {
      return res.status(400).json({ success: false, message: "Minimum rent cannot be greater than maximum rent." });
    }
    if (min !== null || max !== null) {
      query.monthlyRent = {};
      if (min !== null) query.monthlyRent.$gte = min;
      if (max !== null) query.monthlyRent.$lte = max;
    }

    // $all => the post must have EVERY selected utility / amenity
    if (utilities.length) query.utilities = { $all: utilities };
    if (features.length) query.features = { $all: features };

    const posts = await Post.find(query)
      .populate("registeredHouse", "housePropertyName")
      .sort({ createdAt: -1 })
      .lean();

    // TODO: attach `distance` and `iutGate` exactly the way your
    // /posts/filter-by-price controller does (same helper/service call),
    // so the cards and map keep working.
    const iutGate = null;

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No listings found matching the selected filters.",
      });
    }

    return res.status(200).json({ success: true, data: { posts: await attachFlatRatings(posts), iutGate } });
  } catch (err) {
    console.error("filterPosts error:", err);
    return res.status(500).json({ success: false, message: "Could not filter listings." });
  }
};