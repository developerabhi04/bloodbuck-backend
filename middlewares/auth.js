import User from "../Models/UserModel.js";
import catchAsyncErrors from "./catchAsyncError.js";
import ErrorHandler from "./errorHandling.js";
import jwt from "jsonwebtoken";

// Middleware to check if the user is authenticated
export const isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
    // Try to get token from cookies first, then from Authorization header
    let token =
        req.cookies.token ||
        (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
            ? req.headers.authorization.split(" ")[1]
            : null);

    if (!token) {
        return next(new ErrorHandler("Please Login or Register the Account", 401));
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decodedData.id);

    next();
});

// Middleware to check if the user has required roles (e.g., admin)
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ErrorHandler(`Role: ${req.user.role} is not allowed to access this resource`, 403));
        }
        next();
    };
};
