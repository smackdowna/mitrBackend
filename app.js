import express from "express";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import ErrorMiddleware from "./middlewares/Error.js";

config({
  path: "./config/config.env",
});

const app = express();

//using middleware
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(cookieParser());

app.use(
  cors({
    origin: ["*", "http://localhost:3000", "http://localhost:5173","https://mitr-consultancy.vercel.app","https://mitraconsultancy.co.in","https://www.mitraconsultancy.co.in","https://mitrconsultancy.netlify.app"],
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT"],
  })
);


import user from "./routes/userRoutes.js";
import course from "./routes/courseRoute.js";
import order from "./routes/orderRoute.js";



app.use("/api/v1", user);
app.use("/api/v1", course);
app.use("/api/v1", order);




export default app;

app.get("/", (req, res) => res.send(`<h1>Welcome To MITR Consultancy</h1>`));

app.get("/api/v1/getkey", (req, res) =>
  res.status(200).json({ key: process.env.RAZORPAY_API_KEY })
);

app.use(ErrorMiddleware);
