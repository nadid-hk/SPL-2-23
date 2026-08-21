import { HouseDistance } from "../models/houseDistance.model.js";
import { distanceFromIut, walkingMinutes, ridingMinutes } from "../utils/distance.util.js";
import { IUT_GATE } from "../constants.js";

/**
 * Compute the straight-line distance from `coordinates` (GeoJSON [lng, lat])
 * to the IUT gate and upsert it into HouseDistance, keyed by the
 * HomeRegister the post belongs to.
 *
 * Keyed on `homeRegister` (not on the Post) on purpose: distance is a
 * property of the physical house's location, not of any one listing for it.
 * If the same house gets re-posted later (e.g. after being marked rented
 * and then available again), we reuse the same distance doc instead of
 * recomputing/duplicating it — the `unique: true` index on `homeRegister`
 * in the schema enforces this at the DB level too.
 */
export const upsertHouseDistance = async (homeRegisterId, coordinates) => {
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
        // Nothing sane to compute against — leave any existing record alone.
        return null;
    }

    const meters = distanceFromIut(coordinates);

    const doc = await HouseDistance.findOneAndUpdate(
        { homeRegister: homeRegisterId },
        {
            homeRegister: homeRegisterId,
            distanceMeters: meters,
            distanceKm: Number((meters / 1000).toFixed(1)),
            estimatedWalkMinutes: walkingMinutes(meters),
            estimatedRideMinutes: ridingMinutes(meters),
            referencePoint: [IUT_GATE.lat, IUT_GATE.lng],
            calculatedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return doc;
};

/**
 * Fetch distance docs for a batch of HomeRegister ids and return them keyed
 * by homeRegister id (as a string) for cheap O(1) lookup while mapping over
 * a list of posts.
 */
export const getHouseDistancesMap = async (homeRegisterIds) => {
    const ids = [...new Set(homeRegisterIds.filter(Boolean).map(String))];
    if (ids.length === 0) return new Map();

    const distances = await HouseDistance.find({ homeRegister: { $in: ids } }).lean();
    return new Map(distances.map((d) => [String(d.homeRegister), d]));
};