import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import validator from "validator";

const educationSchema = new mongoose.Schema({
  institute: { type: String, required: true },
  degree: { type: String, required: true },
  branch: { type: String, required: true },
  semester: { type: String, required: true },
  year: { type: String, required: true },
  endDate: { type: String, required: true }
});



const schema = new mongoose.Schema({
  full_name: {
    type: String,
  },
  email: {
    type: String,
    validate: [validator.isEmail, "Please Enter a valid Email"],
  },
  mobileNumber: {
    type: String,
    required: [true, "Please Enter your mobileNumber"],
    maxLength: [10, "Number cannot exceed 10 Number"],
  },
  country: {
    type: String,
  },
  state: {
    type: String,
  },
  city: {
    type: String,
  },
  pinCode: {
    type: String,
  },
  education: {
    type: [educationSchema],
    required: true,
  },
  role: {
    type: String,
    default: "user",
  },
  verified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
  },
  otp_expiry: {
    type: Date,
  },
  purchasedCourses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

schema.methods.getJWTToken = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

schema.index({ otp_expiry: 1 }, { expireAfterSeconds: 0 });

export const User = mongoose.model("User", schema);
