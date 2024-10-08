import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generatAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generatAccessToken();
    const refershToken = await user.generatRefreshToken();

    user.refershToken = refershToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refershToken };
  } catch (error) {
    throw new apiError(
      500,
      "somthing went wrong while generating refresh and access token "
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user data from frontend. ✅
  const { fullName, username, email, password } = req.body;

  // Validation - non empty.
  if (
    !fullName ||
    !username ||
    !email ||
    !password ||
    [fullName, username, email, password].some((feild) => feild?.trim() === "")
  ) {
    throw new apiError(400, "All feild are required");
  }

  // check if user already exist ??
  const existuser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existuser) {
    throw new apiError(409, "user with email or username already exists");
  }

  // check for image or avtar
  let avatarLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.avtar) &&
    req.files.avtar.length > 0
  ) {
    avatarLocalPath = req.files.avtar[0].path;
  }

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    avatarLocalPath = req.files.coverImage[0].path;
  }

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

const loginUser = asyncHandler(async (req, res) => {
  // create refresh token and session token
  // send response in cookies

  // get data --> body ( usernme || email and password)
  const { username, email, password } = req.body;

  if (!(username || email)) {
    throw new apiError(400, "please check you email or username is wrong");
  }

  // find user
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) throw new apiError(404, "user dos'nt exist");

  // check password
  if (!(await user.isPasswordCorrect(password)))
    throw new apiError(401, "invalid user credentials");

  const { accessToken, refershToken } = await generatAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refershToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refershToken", refershToken, options)
    .json(
      new apiResponse(
        200,
        {
          loggedInUser,
          accessToken,
          refershToken,
        },
        "user logged in succussfully"
      )
    );
});

const loggoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refershToken: undefined,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refershToken", options)
    .json(new apiResponse(200, {}, "user logged out "));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refershToken || req.body.refershToken;

    if (!incomingRefreshToken) throw new apiError(401, "unathorized request");

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) throw new apiError(404, "invalid refresh token");

    if (incomingRefreshToken !== user.refershToken)
      throw new apiError(404, "refresh token has expired or used");

    const { accessToken, refershToken } = await generatAccessAndRefreshToken(
      user._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refershToken", refershToken, options)
      .json(
        new apiResponse(
          200,
          {
            accessToken,
            refershToken,
          },
          "access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new apiError(400, error.message || "invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) throw new apiError(400, "invalid old password");

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "current user feteched successfully ");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName && !email) throw new apiError(400, "all feild are required");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password -refershToken");

  return res
    .status(200)
    .json(new apiResponse(200, user, "account details updated successfullys"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const localPathFile = req.file?.path;

  if (!localPathFile) throw new apiError(400, "avatar file missing");

  const avtar = await uploadOnCloudinary(localPathFile);

  if (!avtar.url) throw new apiError(500, "Error while uploding avatar file");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avtar: avtar.url,
      },
    },
    { new: true }
  ).select("-password -refershToken");

  return res
    .status(201)
    .json(new apiResponse(201, user, "avatar has change successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const localPathFile = req.file?.path;

  if (!localPathFile) throw new apiError(400, "avatar file missing");

  const coverImage = await uploadOnCloudinary(localPathFile);

  if (!coverImage.url)
    throw new apiError(500, "Error while uploding coverImage file");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password -refershToken");

  return res
    .status(201)
    .json(new apiResponse(201, user, "avatar has change successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) throw new apiError(400, "username is missing");

  const channel = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelSubscribedToCount: {
          $size: "subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user._id, "$subscribers"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        avtar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  console.log(channel);

  if (!channel?.length) throw new apiError(404, "channel do'nt exist");

  return res
    .status(200)
    .json(
      new apiResponse(200, channel[0], "user channel feteched succussfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: _id,
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        user[0].watchHistory,
        "watch history fetched succussfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  loggoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  updateAccountDetails,
};
