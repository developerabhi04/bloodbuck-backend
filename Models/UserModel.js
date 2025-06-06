import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            minLength: 8,
            select: false,
            required: function () {
                return !this.googleId; // Password is required only if not using Google authentication
            },
        },
        avatar: [
            {
                public_id: {
                    type: String,
                },
                url: {
                    type: String,
                },
            },
        ],
        role: {
            type: String,
            default: "user",
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true, // Allows null values
        },
        resetPasswordToken: String,
        resetPasswordExpire: Date,
    },
    { timestamps: true }
);

// Hash password before saving (only if password is modified)
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password") || !this.password) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Generate JWT token
UserSchema.methods.getJWTToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || "7d",
    });
};


// Compare Password
UserSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate Password Reset Token
UserSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");
    this.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    return resetToken;
};

const User = mongoose.model("User", UserSchema);
export default User;
