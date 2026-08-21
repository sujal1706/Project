import genToken from "../config/token.js";
import User from "../models/user.model.js";


// ============================================================
// GOOGLE AUTHENTICATION
// POST /api/auth/google
// ============================================================

export const googleAuth = async (req, res) => {
    try {
        console.log("");
        console.log("==========================================");
        console.log("GOOGLE AUTHENTICATION");
        console.log("==========================================");

        const { name, email } = req.body;

        console.log("Name:", name);
        console.log("Email:", email);

        // ========================================================
        // VALIDATION
        // ========================================================

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required",
            });
        }

        const normalizedEmail = email
            .trim()
            .toLowerCase();

        // ========================================================
        // FIND EXISTING USER
        // ========================================================

        let user = await User.findOne({
            email: normalizedEmail,
        });

        // ========================================================
        // CREATE NEW USER
        // ========================================================

        if (!user) {
            console.log("Creating new user...");

            user = await User.create({
                name: name.trim(),
                email: normalizedEmail,
                credits: 100,
            });

            console.log(
                "✅ New user created:",
                user._id.toString()
            );
        } else {
            console.log(
                "✅ Existing user found:",
                user._id.toString()
            );

            // Optional: update name if Google name changed
            if (
                name &&
                user.name !== name.trim()
            ) {
                user.name = name.trim();
                await user.save();
            }
        }

        // ========================================================
        // MAKE SURE CREDITS ARE VALID
        // ========================================================

        if (
            user.credits === undefined ||
            user.credits === null ||
            !Number.isFinite(Number(user.credits))
        ) {
            user.credits = 0;

            await user.save();
        }

        // ========================================================
        // GENERATE JWT
        // ========================================================

        const token = await genToken(user._id);

        console.log(
            "JWT generated successfully"
        );

        // ========================================================
        // SET WEB COOKIE
        // ========================================================

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/",
        });

        // ========================================================
        // RESPONSE
        // ========================================================

        const safeUser = {
            _id: user._id,
            name: user.name,
            email: user.email,
            credits: Number(user.credits || 0),
        };

        console.log("User:", safeUser);
        console.log("Credits:", safeUser.credits);

        console.log(
            "=========================================="
        );

        return res.status(200).json({
            success: true,
            message: "Google authentication successful",

            // IMPORTANT FOR ANDROID
            token,

            user: safeUser,
        });

    } catch (error) {
        console.error("");
        console.error(
            "❌ GOOGLE AUTH ERROR"
        );
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Google authentication failed",
            error: error.message,
        });
    }
};


// ============================================================
// LOGOUT
// GET /api/auth/logout
// ============================================================

export const logOut = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            path: "/",
        });

        return res.status(200).json({
            success: true,
            message: "Logout successfully",
        });

    } catch (error) {
        console.error(
            "Logout error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Logout failed",
            error: error.message,
        });
    }
};