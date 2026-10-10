
import jwt from "jsonwebtoken";
import User from "../model/User.js";

export const protect = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;

        if (!authorization?.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication token required.",
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Authentication is not configured.",
            });
        }

        const token = authorization.slice(7);
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.userId).select(
            "_id name email role"
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found.",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token.",
        });
    }
};

export const adminOnly = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Admin access required.",
        });
    }

    next();
};
