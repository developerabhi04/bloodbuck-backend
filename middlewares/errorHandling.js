class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;

        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorMiddleware = (err, req, res, next) => {
    err.message = err.message || "Internal Server Error";
    err.statusCode = err.statusCode || 500;

    // Wrong Mongodb ID cast error
    if (err.name === "CastError") {
        const message = `Resource not found. Invalid: ${err.path}`;
        err = new ErrorHandler(message, 400)
    }


    // Mongoose duplicate key error
    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} Entered`;
        err = new ErrorHandler(message, 400);
    }

    // Wrong JWT error
    if (err.name === "JsonWebTokenError") {
        const message = `Json web Token is Invalid, Try again`;
        err = new ErrorHandler(message, 400);
    }

    // JWT Expire error
    if (err.name === "TokenExpiredError") {
        const message = `Json web Token is Expired, Try again`;
        err = new ErrorHandler(message, 400);
    }



    return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        // error: err.stack,
    });
};

export default ErrorHandler;
