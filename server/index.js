import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/connectDb.js";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import interviewRouter from "./routes/interview.route.js";
import paymentRouter from "./routes/payment.route.js";

dotenv.config();

const app = express();

// ===============================
// CORS
// ===============================
const allowedOrigins = [
  "https://interview-frontend-qvqq.onrender.com",
  "http://localhost:5173",
  "capacitor://localhost"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin
      // (some mobile/native requests may not send Origin)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

// ===============================
// BODY PARSER
// ===============================
app.use(express.json());

// ===============================
// COOKIE PARSER
// ===============================
app.use(cookieParser());

// ===============================
// TEST ROUTE
// ===============================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "InterviewIQ backend is running"
  });
});

// ===============================
// API ROUTES
// ===============================
app.use("/api/auth", authRouter);

app.use("/api/user", userRouter);

app.use("/api/interview", interviewRouter);

app.use("/api/payment", paymentRouter);

// ===============================
// PORT
// ===============================
const PORT = process.env.PORT || 8000;

// ===============================
// START SERVER
// ===============================
const startServer = async () => {
  try {
    await connectDb();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
  }
};

startServer();