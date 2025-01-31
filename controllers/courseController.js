import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import { Course } from "../models/Course.js";
import cloudinary from "cloudinary";
import getDataUri from "../utils/dataUri.js";

//create course
export const createCourse = catchAsyncError(async (req, res, next) => {
  const {
    courseName,
    title,
    description,
    rating,
    totalEnrolled,
    lessons,
    price,
    duration,
  } = req.body;

  // Convert JSON string to actual JSON object
  const phases = req.body.phases ? JSON.parse(req.body.phases) : [];
  const skillsCovered = req.body.skillsCovered
    ? JSON.parse(req.body.skillsCovered)
    : [];

  if (
    !courseName ||
    !title ||
    !description ||
    !rating ||
    !totalEnrolled ||
    !lessons ||
    !price ||
    !duration ||
    !phases.length ||
    !skillsCovered.length
  )
    return next(new ErrorHandler("Please Enter all fields", 400));

  const file = req.file;

  const fileUri = getDataUri(file);
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  const course = await Course.create({
    courseName,
    title,
    description,
    rating,
    totalEnrolled,
    lessons,
    price,
    duration,
    phases,
    skillsCovered,
    poster: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  });

  res.status(201).json({
    success: true,
    message: "Course Created successfully.",
    course,
  });
});

//get all course
export const getAllCourses = catchAsyncError(async (req, res, next) => {
  const { keyword } = req.query; // Assuming 'keyword' is passed as a query param

  // Define the query object
  const query = {};

  // Add search by course name (title) using the 'keyword'
  if (keyword) {
    query.courseName = {
      $regex: keyword.trim(), // Ensure no extra spaces
      $options: "i", // Case-insensitive search
    };
  }

  // Fetch courses based on the query
  const courses = await Course.find(query).select("-lectures");

  res.status(200).json({
    success: true,
    courses,
  });
});

//delete course
export const deleteCourse = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const course = await Course.findById(id);

  if (!course) return next(new ErrorHandler("Course Not Found", 404));

  await cloudinary.v2.uploader.destroy(course.poster.public_id);


  await Course.deleteOne({ _id: id });

  res.status(200).json({
    success: true,
    message: "Course deleted successfully",
  });
});

//get course details
export const getCoursedetails = catchAsyncError(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) return next(new ErrorHandler("Course Not Found", 404));

  res.status(200).json({
    success: true,
    course,
  });
});

//edit course
export const editCourse = catchAsyncError(async (req, res, next) => {
    const { id } = req.params; // Get course ID from params
    const {
      courseName,
      title,
      description,
      rating,
      totalEnrolled,
      lessons,
      price,
      duration,
      phases, // Directly handle phases and skillsCovered as fields
      skillsCovered,
    } = req.body;
  
    // Convert JSON string to actual JSON object for phases and skillsCovered
    let parsedPhases = phases ? JSON.parse(phases) : undefined;
    let parsedSkillsCovered = skillsCovered ? JSON.parse(skillsCovered) : undefined;
  
    let course = await Course.findById(id);
    if (!course) return next(new ErrorHandler("Course not found", 404));
  
    // Handle poster update if a new file is uploaded
    if (req.file) {
      const fileUri = getDataUri(req.file);
      const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);
  
      // Delete the old poster from Cloudinary
      if (course.poster && course.poster.public_id) {
        await cloudinary.v2.uploader.destroy(course.poster.public_id);
      }
  
      course.poster = {
        public_id: mycloud.public_id,
        url: mycloud.secure_url,
      };
    }
  
    // Only update fields if they are passed
    if (courseName) course.courseName = courseName;
    if (title) course.title = title;
    if (description) course.description = description;
    if (rating) course.rating = rating;
    if (totalEnrolled) course.totalEnrolled = totalEnrolled;
    if (lessons) course.lessons = lessons;
    if (price) course.price = price;
    if (duration) course.duration = duration;
    if (parsedPhases !== undefined) course.phases = parsedPhases; // Don't update if not passed
    if (parsedSkillsCovered !== undefined) course.skillsCovered = parsedSkillsCovered; // Don't update if not passed
  
    await course.save(); // Save the updated course
  
    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course,
    });
  });
  