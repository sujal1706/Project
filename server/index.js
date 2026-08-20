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

/* =========================================================
   CORS
========================================================= */

const allowedOrigins = [
  "https://interview-frontend-qvqq.onrender.com",
  "http://localhost:5173",
  "http://localhost:8100",
  "capacitor://localhost",
  "http://localhost"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Browser/native requests without Origin
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ CORS BLOCKED:", origin);

      return callback(
        new Error(`CORS blocked origin: ${origin}`)
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With"
    ]
  })
);

/* =========================================================
   BODY PARSER
========================================================= */

app.use(
  express.json({
    limit: "10mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb"
  })
);

/* =========================================================
   COOKIE PARSER
========================================================= */

app.use(cookieParser());

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "InterviewIQ backend is running",
    environment: process.env.NODE_ENV || "production"
  });
});

/* =========================================================
   API ROUTES
========================================================= */

app.use("/api/auth", authRouter);

app.use("/api/user", userRouter);

app.use("/api/interview", interviewRouter);

app.use("/api/payment", paymentRouter);

/* =========================================================
   404 HANDLER
========================================================= */

app.use((req, res) => {
  console.log("❌ Route not found:", req.method, req.originalUrl);

  res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl
  });
});

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use((err, req, res, next) => {
  console.error("=================================");
  console.error("GLOBAL SERVER ERROR");
  console.error("=================================");

  console.error("Message:", err.message);
  console.error("Stack:", err.stack);

  if (err.message?.includes("CORS")) {
    return res.status(403).json({
      success: false,
      message: "CORS error",
      error: err.message
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : undefined
  });
});

/* =========================================================
   PORT
========================================================= */

const PORT = process.env.PORT || 8000;

/* =========================================================
   START SERVER
========================================================= */

const startServer = async () => {
  try {
    await connectDb();

    app.listen(PORT, () => {
      console.log("=================================");
      console.log("✅ SERVER STARTED");
      console.log("=================================");
      console.log(`PORT: ${PORT}`);
      console.log(
        `Environment: ${
          process.env.NODE_ENV || "production"
        }`
      );
      console.log("=================================");
    });
  } catch (error) {
    console.error("=================================");
    console.error("❌ SERVER START FAILED");
    console.error("=================================");
    console.error(error);
  }
};

startServer();