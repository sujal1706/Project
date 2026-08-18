import User from "../models/user.model.js";

export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User ID not found"
            });
        }

        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        console.error("Get current user error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get current user",
            error: error.message
        });
    }
};