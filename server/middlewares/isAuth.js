import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const isAuth = async (req, res, next) => {
    try {
        console.log("");
        console.log("==========================================");
        console.log("🔐 AUTHENTICATION CHECK");
        console.log("==========================================");

        // ========================================================
        // CHECK TOKEN COOKIE
        // ========================================================

        const token = req.cookies?.token;

        console.log(
            "Token exists:",
            Boolean(token)
        );

        console.log(
            "Cookie names:",
            Object.keys(req.cookies || {})
        );

        // ========================================================
        // NO TOKEN
        // ========================================================

        if (!token) {
            console.error(
                "❌ No authentication token found"
            );

            return res.status(401).json({
                success: false,
                message:
                    "User is not authenticated",
            });
        }

        // ========================================================
        // JWT VERIFY
        // ========================================================

        let decodedToken;

        try {
            decodedToken = jwt.verify(
                token,
                process.env.JWT_SECRET
            );
        } catch (jwtError) {
            console.error(
                "❌ JWT verification failed:",
                jwtError.message
            );

            return res.status(401).json({
                success: false,
                message:
                    "Invalid or expired authentication token",
            });
        }

        console.log(
            "Decoded token:",
            decodedToken
        );

        // ========================================================
        // CHECK USER ID
        // ========================================================

        const userId =
            decodedToken?.userId ||
            decodedToken?.id ||
            decodedToken?._id;

        if (!userId) {
            console.error(
                "❌ User ID missing from token"
            );

            return res.status(401).json({
                success: false,
                message:
                    "Invalid authentication token",
            });
        }

        console.log(
            "Authenticated User ID:",
            userId
        );

        // ========================================================
        // FIND USER
        // ========================================================

        const user = await User.findById(userId);

        if (!user) {
            console.error(
                "❌ User not found:",
                userId
            );

            return res.status(401).json({
                success: false,
                message:
                    "User account not found",
            });
        }

        console.log(
            "✅ User found:",
            user._id
        );

        console.log(
            "User email:",
            user.email
        );

        // ========================================================
        // SET REQUEST USER
        // ========================================================

        req.userId = user._id;

        req.user = user;

        // ========================================================
        // SUCCESS
        // ========================================================

        console.log(
            "✅ AUTHENTICATION SUCCESS"
        );

        console.log(
            "=========================================="
        );

        next();

    } catch (error) {
        console.error("");
        console.error(
            "=========================================="
        );

        console.error(
            "❌ isAuth ERROR"
        );

        console.error(
            "=========================================="
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Full error:",
            error
        );

        return res.status(401).json({
            success: false,
            message:
                "Authentication failed",
        });
    }
};

export default isAuth;