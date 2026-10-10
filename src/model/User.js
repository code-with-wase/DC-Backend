
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 80,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 255,
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

export default User;
