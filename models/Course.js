import mongoose from "mongoose";

const topicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  contents: {
    type: [String],
    required: true,
  },
});

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  topics: {
    type: [topicSchema],
    required: true,
  },
});

const phaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  phaseDuration: {
    type: String,
    required: true,
  },
  modules: {
    type: [moduleSchema],
    required: true,
  },
});

const courseSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    default: 4,
  },
  totalEnrolled: {
    type: Number,
    default: 0,
  },
  lessons: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  poster: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  phases: {
    type: [phaseSchema],
    required: true,
  },
  skillsCovered: {
    type: [String],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Course = mongoose.model("Course", courseSchema);
