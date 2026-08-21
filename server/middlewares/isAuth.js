import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const isAuth = async (req, res, next) => {
    try {
        console.log("");
        console.log("==========================================");
        console.log("🔐 AUTHENTICATION CHECK");
        console.log("==========================================");

        // ========================================================
        // 1. GET TOKEN FROM COOKIE
        // ========================================================

        const cookieToken =
            req.cookies?.token;

        // ========================================================
        // 2. GET TOKEN FROM AUTHORIZATION HEADER
        // ========================================================

        const authHeader =
            req.headers.authorization;

        let headerToken = null;

        if (
            authHeader &&
            authHeader.startsWith("Bearer ")
        ) {
            headerToken =
                authHeader.substring(7);
        }

        // ========================================================
        // 3. USE HEADER FIRST, COOKIE SECOND
        // ========================================================

        const token =
            headerToken ||
            cookieToken;

        console.log(
            "Cookie token exists:",
            Boolean(cookieToken)
        );

        console.log(
            "Authorization token exists:",
            Boolean(headerToken)
        );

        console.log(
            "Final token exists:",
            Boolean(token)
        );

        // ========================================================
        // 4. TOKEN NOT FOUND
        // ========================================================

        if (!token) {
            console.error(
                "❌ No authentication token found"
            );

            return res.status(401).json({
                success: false,
                message: "User is not authenticated",
            });
        }

        // ========================================================
        // 5. VERIFY JWT
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
            "✅ Decoded token:",
            decodedToken
        );

        // ========================================================
        // 6. GET USER ID
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

        // ========================================================
        // 7. FIND USER
        // ========================================================

        const user = await User.findById(
            userId
        );

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

        // ========================================================
        // 8. VALIDATE CREDITS
        // ========================================================

        if (
            user.credits === undefined ||
            user.credits === null ||
            !Number.isFinite(
                Number(user.credits)
            )
        ) {
            user.credits = 0;

            await user.save();
        }

        // ========================================================
        // 9. ATTACH USER
        // ========================================================

        req.userId = user._id;

        req.user = user;

        console.log(
            "✅ Authentication successful"
        );

        console.log(
            "User ID:",
            user._id.toString()
        );

        console.log(
            "Email:",
            user.email
        );

        console.log(
            "Credits:",
            user.credits
        );

        console.log(
            "=========================================="
        );

        next();

    } catch (error) {
        console.error(
            "❌ isAuth ERROR:",
            error
        );

        return res.status(401).json({
            success: false,
            message: "Authentication failed",
        });
    }
};

export default isAuth;