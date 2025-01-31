import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/auth.js";
import {
  createCourse,
  deleteCourse,
  editCourse,
  getAllCourses,
  getCoursedetails,
} from "../controllers/courseController.js";
import singleUpload from "../middlewares/multer.js";

const router = express.Router();

//create course --Admin
router
  .route("/createcourse")
  .post(isAuthenticated, authorizeRoles("admin"), singleUpload, createCourse);

//get all course without lectures
router.route("/courses").get(getAllCourses);

// get course details
router
  .route("/course/:id")
  .get(getCoursedetails)
  .put(isAuthenticated, authorizeRoles("admin"), singleUpload, editCourse)
  .delete(isAuthenticated, authorizeRoles("admin"), deleteCourse);

export default router;
