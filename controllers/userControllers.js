import { User } from "../models/userModel.js";
import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sendToken } from "../utils/sendToken.js";
import {Course} from "../models/Course.js";

//generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

//send OTP
export const sendOTP = catchAsyncError(async (req, res, next) => {
  const { mobileNumber, email } = req.body;

  if (!mobileNumber || !email)
    return next(new ErrorHandler("Please enter all fields", 400));

  const hardcodedOtpEnabled = process.env.HARDCODED_OTP === "true";
  const otp = hardcodedOtpEnabled ? "000000" : generateOTP();

  let user = await User.findOne({ mobileNumber });

  if (!user) {
    user = await User.create({
      mobileNumber,
      email,
      otp: otp,
      otp_expiry: Date.now() + 60 * 1000,
    });
  } else {
    user.otp = otp;
    user.otp_expiry = Date.now() + 60 * 1000;
    await user.save();
  }

  res.status(200).json({
    success: true,
    message: `OTP ${
      hardcodedOtpEnabled ? "hardcoded" : "random"
    } sent successfully to registered mobile number`,
  });
});

//verifyOTP
export const verifyOTP = catchAsyncError(async (req, res, next) => {
  const { mobileNumber, otp } = req.body;

  if (!mobileNumber || !otp)
    return next(new ErrorHandler("Please Enter mobile number and OTP"));

  const user = await User.findOne({ mobileNumber });

  if (!user) return next(new ErrorHandler("User not found", 400));

  if (user.otp !== otp || user.otp_expiry < Date.now())
    return next(new ErrorHandler("Invalid OTP or OTP Expired", 400));

  user.otp = null;
  user.otp_expiry = null;
  await user.save();

  if (!user.full_name) {
    // New user, redirect to registration step
    return res.status(200).json({
      message: "OTP verified, proceed to registration",
      newUser: true,
    });
  }

  sendToken(res, user, `Welcome Back ${user.full_name}`, 200);
});

//registration
export const registerUser = catchAsyncError(async (req, res, next) => {
  const {
    full_name,
    email,
    gender,
    language,
    dob,
    mobileNumber,
    occupation,
    country,
    state,
    city,
    pinCode,
  } = req.body;

  if (!mobileNumber)
    return next(new ErrorHandler("Mobile number is required", 400));

  // Check if the user already exists with the same mobile number and is verified
  let existingUser = await User.findOne({ mobileNumber, verified: true });

  if (existingUser) {
    return next(
      new ErrorHandler("User with this mobile number already exists", 400)
    );
  }

  // Check if the user exists but is not verified
  let unverifiedUser = await User.findOne({ mobileNumber, verified: false });

  // If an unverified user exists, update the user's details
  if (unverifiedUser) {
    // Update the unverified user's details
    unverifiedUser.full_name = full_name || unverifiedUser.full_name;
    unverifiedUser.email = email || unverifiedUser.email;
    unverifiedUser.gender = gender || unverifiedUser.gender;
    unverifiedUser.language = language || unverifiedUser.language;
    unverifiedUser.dob = dob || unverifiedUser.dob;
    unverifiedUser.occupation = occupation || unverifiedUser.occupation;
    unverifiedUser.country = country || unverifiedUser.country;
    unverifiedUser.state = state || unverifiedUser.state;
    unverifiedUser.city = city || unverifiedUser.city;
    unverifiedUser.pinCode = pinCode || unverifiedUser.pinCode;
    unverifiedUser.verified = "true";

    await unverifiedUser.save();

    return sendToken(
      res,
      unverifiedUser,
      "User details updated successfully",
      200
    );
  }

  // Create a new user
  const user = await User.create({
    full_name,
    email,
    gender,
    language,
    dob,
    mobileNumber,
    occupation,
    country,
    state,
    city,
    pinCode,
  });

  sendToken(res, user, "Registered Successfully", 200);
});

//get my profile
export const getmyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});

//logout
export const logout = catchAsyncError(async (req, res, next) => {
  res.cookie("token", "", {
    expires: new Date(0), // Set the expiration date to a past date to immediately expire the cookie
    httpOnly: true,
    secure: "true", // Set to true in production, false in development
    sameSite: "None", // Ensure SameSite is set to None for cross-site cookies
  });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

//update user details
export const updateUserDetails = catchAsyncError(async (req, res, next) => {
  const {
    full_name,
    email,
    gender,
    language,
    dob,
    mobileNumber,
    occupation,
    country,
    state,
    city,
    pinCode,
  } = req.body;

  // Ensure the user is logged in
  const userId = req.user.id;

  // Fetch the user from the database
  let user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Update basic details if provided
  if (full_name) user.full_name = full_name;
  if (email) user.email = email;
  if (gender) user.gender = gender;
  if (language) user.language = language;
  if (dob) user.dob = dob;
  if (mobileNumber) user.mobileNumber = mobileNumber;
  if (occupation) user.occupation = occupation;
  if (country) user.country = country;
  if (state) user.state = state;
  if (city) user.city = city;
  if (pinCode) user.pinCode = pinCode;

  // Save the updated user
  await user.save();

  // Respond with success
  res.status(200).json({
    success: true,
    message: "User details updated successfully",
    user,
  });
});

//get all registered user
export const getAllUser = catchAsyncError(async (req, res, next) => {
  const usersCount = await User.countDocuments();

  const users = await User.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    usersCount,
    users,
  });
});

//get single user
export const getSingleUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHandler("user not found with this Id", 404));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

//get all purchased courses
export const getUserPurchasedCourses = catchAsyncError(
  async (req, res, next) => {
    // Find the user by ID
    const user = await User.findById(req.user.id).populate(
      "purchasedCourses",
      "courseName description poster category"
    );

    // If the user is not found
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Return the purchased courses
    res.status(200).json({
      success: true,
      purchasedCourses: user.purchasedCourses,
    });
  }
);

//get all user who  has purchased courses
export const getUserPurchased = catchAsyncError(async (req, res, next) => {
  const users = await User.find({
    purchasedCourses: { $exists: true, $not: { $size: 0 } },
  }).populate("purchasedCourses", "courseName poster"); // Populate with selected fields

  if (!users) return next(new ErrorHandler("No Purchased", 404));

  res.status(200).json({
    success: true,
    users,
  });
});
