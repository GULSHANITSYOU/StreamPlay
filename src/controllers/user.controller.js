import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user data from frontend. ✅
  const { fullName, username, email, password } = req.body;

  // Validation - non empty.
  if (
    [fullName, username, email, password].some((feild) => feild?.trim() === "")
  ) {
    throw new apiError(400, "All feild are required");
  }

  // check if user already exist ??
  const existuser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existuser) {
    throw new apiError(409, "user with emai or username already exists");
  }

  // check for image or avtar
  const avatarLocalPath = req.files?.avtar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new apiError(400, "avtar file is required!");
  }

  // upload them on couldinary - avtar
  const avtar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avtar) {
    throw new apiError(400, "avtar file is required!");
  }

  // create user object - create a new entry in DB
  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    avtar: avtar.url,
    coverImage: coverImage?.url || "",
    password,
  });

  // remove unnessery details from response DB ( password , refresh token )
  const createdUser = await User.findById(user._id).select(
    "-password -refershToken"
  );

  // check for user creation
  if (!createdUser) {
    throw new apiError(500, "something went wrong while registering user ");
  }

  // return res ----- with -----> 201 created
  return res
    .status(201)
    .json(new apiResponse(200, createdUser, "user registered successfully"));
});

export { registerUser };
