// ============================================================
// LOAD ENVIRONMENT VARIABLES FIRST
// IMPORTANT: THIS MUST BE THE FIRST IMPORT
// ============================================================

import "dotenv/config";

// ============================================================
// IMPORTS
// ============================================================

import express from "express";
import connectDb from "./config/connectDb.js";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import interviewRouter from "./routes/interview.route.js";
import paymentRouter from "./routes/payment.route.js";

// ============================================================
// ENVIRONMENT CHECK
// ============================================================

console.log("");
console.log("==========================================");
console.log("🔧 ENVIRONMENT CHECK");
console.log("==========================================");

console.log(
    "RAZORPAY_KEY_ID:",
    process.env.RAZORPAY_KEY_ID
        ? "✅ LOADED"
        : "❌ MISSING"
);

console.log(
    "RAZORPAY_KEY_SECRET:",
    process.env.RAZORPAY_KEY_SECRET
        ? "✅ LOADED"
        : "❌ MISSING"
);

console.log(
    "JWT_SECRET:",
    process.env.JWT_SECRET
        ? "✅ LOADED"
        : "❌ MISSING"
);

console.log(
    "MONGODB_URL:",
    process.env.MONGODB_URL
        ? "✅ LOADED"
        : "❌ MISSING"
);

console.log(
    "PORT:",
    process.env.PORT || 8000
);

console.log("==========================================");
console.log("");

// ============================================================
// CREATE EXPRESS APP
// ============================================================

const app = express();

// ============================================================
// ALLOWED ORIGINS
// ============================================================

const allowedOrigins = [
    "https://interview-frontend-qvqq.onrender.com",
    "http://localhost:5173",
    "capacitor://localhost",
    "http://localhost",
    "https://localhost",
];

// ============================================================
// CORS
// ============================================================

app.use(
    cors({
        origin: function (origin, callback) {

            // Requests without origin
            if (!origin) {
                return callback(null, true);
            }

            // Allowed origins
            if (allowedOrigins.includes(origin)) {

                console.log(
                    "✅ Allowed CORS:",
                    origin
                );

                return callback(null, true);
            }

            // Block unknown origin
            console.log(
                "❌ Blocked CORS:",
                origin
            );

            return callback(
                new Error(
                    `Not allowed by CORS: ${origin}`
                )
            );
        },

        credentials: true,

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],
    })
);

// ============================================================
// BODY PARSER
// ============================================================

app.use(
    express.json({
        limit: "10mb",
    })
);

// ============================================================
// COOKIE PARSER
// ============================================================

app.use(cookieParser());

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/", (req, res) => {

    return res.status(200).json({
        success: true,

        message:
            "InterviewIQ backend is running",

        razorpayConfigured:
            Boolean(
                process.env.RAZORPAY_KEY_ID &&
                process.env.RAZORPAY_KEY_SECRET
            ),
    });
});

// ============================================================
// AUTH ROUTES
// ============================================================

app.use(
    "/api/auth",
    authRouter
);

// ============================================================
// USER ROUTES
// ============================================================

app.use(
    "/api/user",
    userRouter
);

// ============================================================
// INTERVIEW ROUTES
// ============================================================

app.use(
    "/api/interview",
    interviewRouter
);

// ============================================================
// PAYMENT ROUTES
// ============================================================

app.use(
    "/api/payment",
    paymentRouter
);

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {

    console.log(
        "❌ Route not found:",
        req.method,
        req.originalUrl
    );

    return res.status(404).json({

        success: false,

        message:
            `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(
    (
        err,
        req,
        res,
        next
    ) => {

        console.error("");
        console.error(
            "=========================================="
        );

        console.error(
            "❌ GLOBAL SERVER ERROR"
        );

        console.error(
            "=========================================="
        );

        console.error(
            "Message:",
            err.message
        );

        console.error(
            "Stack:",
            err.stack
        );

        console.error(
            "=========================================="
        );

        // CORS ERROR
        if (
            err.message?.includes(
                "Not allowed by CORS"
            )
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "CORS error",

                details:
                    err.message,
            });
        }

        // GENERAL ERROR
        return res.status(500).json({

            success: false,

            message:
                err.message ||
                "Internal server error",
        });
    }
);

// ============================================================
// PORT
// ============================================================

const PORT =
    process.env.PORT || 8000;

// ============================================================
// START SERVER
// ============================================================

const startServer = async () => {

    try {

        console.log("");
        console.log(
            "=========================================="
        );

        console.log(
            "🚀 STARTING INTERVIEWIQ BACKEND"
        );

        console.log(
            "=========================================="
        );

        // ====================================================
        // REQUIRED ENVIRONMENT VARIABLES
        // ====================================================

        const requiredEnv = [
            "MONGODB_URL",
            "JWT_SECRET",
            "RAZORPAY_KEY_ID",
            "RAZORPAY_KEY_SECRET",
        ];

        const missingEnv =
            requiredEnv.filter(
                (key) =>
                    !process.env[key]
            );

        // ====================================================
        // STOP SERVER IF ENVIRONMENT IS MISSING
        // ====================================================

        if (
            missingEnv.length > 0
        ) {

            console.error("");

            console.error(
                "❌ REQUIRED ENVIRONMENT VARIABLES ARE MISSING:"
            );

            console.error(
                missingEnv.join(", ")
            );

            console.error("");

            console.error(
                "Check this file:"
            );

            console.error(
                "server/.env"
            );

            console.error("");

            process.exit(1);
        }

        console.log(
            "✅ All required environment variables loaded"
        );

        // ====================================================
        // CONNECT DATABASE
        // ====================================================

        console.log("");

        console.log(
            "🔄 Connecting to MongoDB..."
        );

        await connectDb();

        console.log(
            "✅ MongoDB connected successfully"
        );

        // ====================================================
        // START EXPRESS SERVER
        // ====================================================

        app.listen(
            PORT,
            () => {

                console.log("");

                console.log(
                    "=========================================="
                );

                console.log(
                    `🚀 Server running on port ${PORT}`
                );

                console.log(
                    `🌐 Backend: http://localhost:${PORT}`
                );

                console.log(
                    "💳 Razorpay: CONFIGURED"
                );

                console.log(
                    "🔐 JWT: CONFIGURED"
                );

                console.log(
                    "🍃 MongoDB: CONNECTED"
                );

                console.log(
                    "=========================================="
                );

                console.log("");
            }
        );

    } catch (error) {

        console.error("");

        console.error(
            "=========================================="
        );

        console.error(
            "❌ FAILED TO START SERVER"
        );

        console.error(
            "=========================================="
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Stack:",
            error.stack
        );

        console.error(
            "=========================================="
        );

        process.exit(1);
    }
};

// ============================================================
// START APPLICATION
// ============================================================

startServer();