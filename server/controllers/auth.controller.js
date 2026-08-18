import genToken from "../config/token.js";
import User from "../models/user.model.js";

export const googleAuth = async (req, res) => {
    try {
        const { name, email } = req.body;

        // Validate input
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required"
            });
        }

        // Find existing user
        let user = await User.findOne({ email });

        // Create user if not found
        if (!user) {
            user = await User.create({
                name,
                email
            });
        }

        // Generate JWT
        const token = await genToken(user._id);

        // Store JWT in cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/"
        });

        return res.status(200).json({
            success: true,
            message: "Google authentication successful",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Google auth error:", error);

        return res.status(500).json({
            success: false,
            message: "Google authentication failed",
            error: error.message
        });
    }
};


export const logOut = async (req, res) => {
    try {

        res.clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            path: "/"
        });

        return res.status(200).json({
            success: true,
            message: "Logout successfully"
        });

    } catch (error) {
        console.error("Logout error:", error);

        return res.status(500).json({
            success: false,
            message: "Logout failed",
            error: error.message
        });
    }
};