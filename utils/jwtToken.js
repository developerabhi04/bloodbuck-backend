import dotenv from "dotenv";
dotenv.config();

const sendToken = (user, statusCode, res) => {
    const token = user.getJWTToken();

    const options = {
        httpOnly: true,
        maxAge: (process.env.COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000, // Default to 7 days
        sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
        secure: process.env.NODE_ENV === "production",
    };

    res.status(statusCode).cookie("token", token, options).json({
        success: true,
        user,
        token,
    });
};

export default sendToken;
