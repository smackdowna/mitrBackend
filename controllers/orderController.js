import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import { Order } from "../models/OrderModel.js";
import { Course } from "../models/Course.js";
import { User } from "../models/userModel.js";
import sendEmail from "../utils/sendEmail.js";

//create order
export const createOrder = catchAsyncError(async (req, res, next) => {
  const { courseId, razorpay_payment_id } = req.body;

  // Check if courseId is provided and is an array
  if (!courseId || !Array.isArray(courseId) || courseId.length === 0) {
    return next(new ErrorHandler("Enter valid Course IDs", 400));
  }

  const user = await User.findById(req.user.id);

  const orderCourses = [];
  let price = 0;

  // Process each course ID in the array
  for (const id of courseId) {
    const course = await Course.findById(id);
    if (!course)
      return next(new ErrorHandler(`Course with ID ${id} not found`, 404));

    // Check if the user has already purchased this course
    if (user.purchasedCourses.includes(id)) {
      return next(
        new ErrorHandler(`You have already purchased course with ID ${id}`, 400)
      );
    }

    orderCourses.push(course._id);
    price += course.price;
  }

  // Create the order with all course IDs
  const order = await Order.create({
    user: req.user.id,
    course: orderCourses,
    price: price,
    razorpay_payment_id: razorpay_payment_id,
  });

  // Update the user (purchaser) details after course purchase
  user.purchasedCourses.push(...orderCourses);
  await user.save();

  // Increment totalEnrolled for each course
  for (const id of orderCourses) {
    const course = await Course.findById(id);
    course.totalEnrolled += 1;
    await course.save();
  }

  const email = req.user.email;

  const emailMessage = `Dear ${user.full_name},
  Thank you for choosing MITR Consultancy and enrolling in our [Course Name] program!

  Your training will last for three months, and all communication will take place via Google Chat, our official platform for daily interactions.

  Next Steps:
  Download Google Chat on your device.
  Send a message to mitrconsultancy0101@gmail.com to initiate communication.
  Our team will reach out to guide you through the next steps of your training.
  For any queries, feel free to contact us at mitrconsultancy0101@gmail.com.

  We look forward to supporting you on this journey!

  Best regards,
  MITR Consultancy Team 🏅
  `;

  await sendEmail(
    email,
    "Welcome to MITR Consultancy – Next Steps for Your Training",
    emailMessage
  );

  // Send response with order details
  res.status(200).json({
    success: true,
    message: "Courses Purchased! You can start learning.",
    order,
  });
});

//get my order
export const myOrders = catchAsyncError(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    orders,
  });
});

//get all order--Admin
export const getAllOrders = catchAsyncError(async (req, res, next) => {
  const ordersCount = await Order.countDocuments();

  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .populate("user", "full_name mobileNumber") // Populate user with specific fields
    .populate("course", "courseName"); // Populate course with specific fields

  res.status(200).json({
    success: true,
    ordersCount,
    orders,
  });
});

//get single order
export const getSingleOrder = catchAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "full_name mobileNumber") // Populate user with specific fields
    .populate("course", "courseName"); // Populate course with specific fields
  if (!order) {
    return next(new ErrorHandler("Order not found with this Id", 404));
  }

  res.status(200).json({
    success: true,
    order,
  });
});
