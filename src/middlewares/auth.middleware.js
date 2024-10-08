import jwt from "jsonwebtoken";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header["Authorization"]?.replace("Bearer ", "");

    if (!token) throw new apiError(401, "Unothorized request");

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken._id).select(
      "-password -refershToken"
    );

    if (!user) throw new apiError(401, "invalide access token");

    req.user = user;
    next();
  } catch (error) {
    throw new apiError(401, error?.message || "invalid access token");
  }
});
