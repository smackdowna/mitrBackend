import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";
import {
  getAllUser,
  getmyProfile,
  getSingleUser,
  getUserPurchased,
  getUserPurchasedCourses,
  logout,
  registerUser,
  sendOTP,
  updateUserDetails,
  verifyOTP,
} from "../controllers/userControllers.js";

const router = express.Router();

//sendOTP
router.route("/send-otp").post(sendOTP);

//verifyOTP
router.route("/verify-otp").post(verifyOTP);

//register
router.route("/register").post(registerUser);

//get my profile
router.route("/myprofile").get(isAuthenticated, getmyProfile);

//logout
router.route("/logout").get(logout);

//user update details
router.route("/me/update").put(isAuthenticated, updateUserDetails);

//get all user--Admin
router
  .route("/all/user")
  .get(isAuthenticated, authorizeRoles("admin"), getAllUser);

//get single user--Admin
router
  .route("/user/:id")
  .get(isAuthenticated, authorizeRoles("admin"), getSingleUser);

//update user--Admin
router
  .route("/user/:id")
  .put(isAuthenticated, authorizeRoles("admin"), updateUserDetails);

router.route("/purchased/course").get(isAuthenticated, getUserPurchasedCourses);

//get all user who has purchased the courses
router.route("/all/purchased").get(isAuthenticated,authorizeRoles("admin"),getUserPurchased);

export default router;
