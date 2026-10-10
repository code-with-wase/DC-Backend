
import {
    loginUser,
    getCurrentUser,
} from "../services/authService.js";

export const login = async (req, res) => {
    try {
        const { name, email } = req.body;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            name.trim().length < 2 ||
            name.trim().length > 80 ||
            email.trim().length > 255 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid name and email.",
            });
        }

        const result = await loginUser({
            name: name.trim(),
            email: email.trim().toLowerCase(),
        });

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            ...result,
        });
    } catch (error) {
        console.error("Login controller error:", error.message);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode
                ? error.message
                : "Unable to login.",
        });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await getCurrentUser(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        return res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("Get current user error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch user.",
        });
    }
};
