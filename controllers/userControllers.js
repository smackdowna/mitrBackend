import { User } from "../models/userModel.js";
import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sendToken } from "../utils/sendToken.js";
import sendEmail from "../utils/sendEmail.js";

//generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

//send OTP
export const sendOTP = catchAsyncError(async (req, res, next) => {
  const {  email } = req.body;

  if ( !email)
    return next(new ErrorHandler("email is required", 400));

  const hardcodedOtpEnabled = process.env.HARDCODED_OTP === "true";
  const otp = hardcodedOtpEnabled ? "000000" : generateOTP();

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      email,
      otp: otp,
      otp_expiry: Date.now() + 60 * 1000,
    });
  } else {
    user.otp = otp;
    user.otp_expiry = Date.now() + 60 * 1000;
    await user.save();
  }

  const emailMessage = `Dear User,

  Thank you for choosing MITR Consultancy! 🏆
  
  We're thrilled to have you on board for the upcoming MITR Consultancy event. To ensure the security of your account and expedite your registration process, please verify your account by entering the following One-Time Password (OTP):
  
  OTP: ${otp}
  
  This OTP is exclusively for you and will expire after a limited time. We encourage you to verify your account promptly to secure your spot at the event.
  
  Should you have any questions or concerns, our dedicated support team is here to assist you every step of the way.
  
  Thank you for your trust in MITR Consultancy. We can't wait to see you in action!
  
  Best regards,
  
  MITR Consultancy Team 🏅
  `;

  await sendEmail(email, "Verify your account", emailMessage);

  res.status(200).json({
    success: true,
    message: `OTP ${
      hardcodedOtpEnabled ? "hardcoded" : "random"
    } sent successfully to registered email`,
  });
});

//verifyOTP
export const verifyOTP = catchAsyncError(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp)
    return next(new ErrorHandler("Please Enter mobile number and OTP"));

  const user = await User.findOne({ email });

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
    mobileNumber,
    country,
    state,
    city,
    pinCode,
    education, // Education array as input
  } = req.body;

  if (!email) {
    return next(new ErrorHandler("email is required", 400));
  }

  // Parse education array if it's sent as a string (in case of JSON request)
  let parsedEducation = [];
  if (education) {
    try {
      parsedEducation = Array.isArray(education)
        ? education
        : JSON.parse(education);
    } catch (error) {
      return next(new ErrorHandler("Invalid education format", 400));
    }
  }

  // Check if the user already exists with the same mobile number and is verified
  let existingUser = await User.findOne({ email, verified: true });

  if (existingUser) {
    return next(
      new ErrorHandler("User with this mobile number already exists", 400)
    );
  }

  // Check if the user exists but is not verified
  let unverifiedUser = await User.findOne({ email, verified: false });

  if (unverifiedUser) {
    // Update the unverified user's details
    unverifiedUser.full_name = full_name || unverifiedUser.full_name;
    unverifiedUser.email = email || unverifiedUser.email;
    unverifiedUser.country = country || unverifiedUser.country;
    unverifiedUser.state = state || unverifiedUser.state;
    unverifiedUser.city = city || unverifiedUser.city;
    unverifiedUser.pinCode = pinCode || unverifiedUser.pinCode;
    unverifiedUser.education =
      parsedEducation.length > 0 ? parsedEducation : unverifiedUser.education;
    unverifiedUser.verified = true;

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
    mobileNumber,
    country,
    state,
    city,
    pinCode,
    education: parsedEducation, // Save parsed education array
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
    mobileNumber,
    country,
    state,
    city,
    pinCode,
    education,
  } = req.body;

  let user = await User.findById(req.user.id);
  if (!user) return next(new ErrorHandler("User not found", 404));

  // Only update fields if they are passed
  if (full_name) user.full_name = full_name;
  if (email) user.email = email;
  if (mobileNumber) user.mobileNumber = mobileNumber;
  if (country) user.country = country;
  if (state) user.state = state;
  if (city) user.city = city;
  if (pinCode) user.pinCode = pinCode;
  if (education) user.education = education; // Don't update if not passed

  
  await user.save(); // Save the updated user

  res.status(200).json({
    success: true,
    message: "User updated successfully",
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
