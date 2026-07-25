import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.util.js";
import { createHomeRegistration, getApprovedHomeRegistrations } from "../services/homeRegister.service.js";

// 🐛 REAL BUG (root cause of "two home owners share one profile picture"):
// this used to read `ownerId` straight out of the request body with no
// authentication at all — and this route runs BEFORE any account/session
// exists (a home owner registers with a khatianNumber + password here to
// create their future login, they aren't logged in yet). There is no
// legitimate "current user id" to send at this point, so whatever the
// frontend was sending here was necessarily a fixed/placeholder value —
// meaning every home registration got saved with the exact same `owner`
// field in the database from the moment of registration, not just merged
// later at login. That's why editing one owner's picture showed up for
// every other owner: they were, in the database, the same owner id.
//
// Fix: the server generates a fresh, guaranteed-unique id for every new
// registration itself. Nothing from the client is trusted for this.
export const registerHome = asyncHandler(async (req, res) => {
    const ownerId = new mongoose.Types.ObjectId();

    const registration = await createHomeRegistration(req.validatedData, ownerId);

    return res
        .status(201)
        .json(new ApiResponse(201, registration, "Registration submitted successfully. It is now pending admin approval."));
});

// GET /api/home-register/approved
// Feeds the "House / Property Name" select box on the Post creation form —
// a house can only be chosen there once an admin has approved it.
export const getApprovedHouses = asyncHandler(async (req, res) => {
    const houses = await getApprovedHomeRegistrations();
    return res.status(200).json(new ApiResponse(200, houses, "Approved houses fetched"));
});