
import jwt from "jsonwebtoken";
import User from "../model/User.js";

export const loginUser = async ({ name, email }) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured.");
    }

    if (!process.env.SUPER_ADMIN_EMAIL) {
        throw new Error("SUPER_ADMIN_EMAIL is not configured.");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const adminEmail = process.env.SUPER_ADMIN_EMAIL.trim().toLowerCase();

    const role = normalizedEmail === adminEmail ? "admin" : "user";

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            role,
        });
    } else if (user.role !== role) {
        user.role = role;
        await user.save();
    }

    const token = jwt.sign(
        { userId: user._id.toString() },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1d",
        }
    );

    return {
        token,
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };
};

export const getCurrentUser = async (userId) => {
    return User.findById(userId).select(
        "_id name email role createdAt updatedAt"
    );
};
