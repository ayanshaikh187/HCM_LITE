
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 254,
        },

        passwordHash: {
            type: String,
            required: true,
            select: false,
        },

        role: {
            type: String,
            enum: ["Admin", "HR", "Employee"],
            required: true,
        },

        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        mustChangePassword: {
            type: Boolean,
            default: false,
        },

        passwordChangedAt: {
            type: Date,
            default: null,
        },
        tokenVersion: {
            type: Number,
            default: 0,
            select: false,
        },

        refreshTokenHash: {
            type: String,
            default: null,
            select: false,
        },

        refreshTokenExpiresAt: {
            type: Date,
            default: null,
            select: false,
        },
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
