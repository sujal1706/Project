import jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
    try {
        // Get token from cookie
        const token = req.cookies?.token;

        // No token
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "User is not authenticated"
            });
        }

        // Verify JWT
        const verifyToken = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Check token payload
        if (!verifyToken || !verifyToken.userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token"
            });
        }

        // Store user ID in request
        req.userId = verifyToken.userId;

        // Continue to controller
        next();

    } catch (error) {
        console.error("isAuth error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Authentication failed",
            error: error.message
        });
    }
};

export default isAuth;