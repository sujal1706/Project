import User from "../models/user.model.js";


// ============================================================
// GET CURRENT USER
// GET /api/user/current-user
// ============================================================

export const currentUser = async (req, res) => {
    try {
        const userId = req.userId;

        console.log("");
        console.log(
            "========== CURRENT USER =========="
        );

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User ID not found",
            });
        }

        const user = await User.findById(
            userId
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

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

        const safeUser = {
            _id: user._id,
            name: user.name,
            email: user.email,
            credits: Number(user.credits || 0),
        };

        console.log(
            "User:",
            safeUser
        );

        console.log(
            "================================="
        );

        return res.status(200).json({
            success: true,
            message:
                "Current user fetched successfully",
            user: safeUser,
        });

    } catch (error) {
        console.error(
            "❌ Get current user error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to get current user",
        });
    }
};