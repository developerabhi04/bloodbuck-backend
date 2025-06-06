import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cloudinary from "cloudinary";
import { connectDB } from "./database/database.js";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

// ErrorHandler
import { errorMiddleware } from "./middlewares/errorHandling.js";

// Load environment variables
dotenv.config({
  path: "./database/.env",
});

const app = express();
const PORT = process.env.PORT || 4000; // Ensure PORT has a default value
const MONGODB = process.env.MONGO_URL;

// Handling Uncaught Exceptions
process.on("uncaughtException", (err) => {
  console.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

// Connect to MongoDB
connectDB(MONGODB);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});


// Middleware Setup
app.use(express.json({ limit: "50mb" })); // Ensure JSON parsing before routes
app.use(cookieParser());
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));


app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

// CORS Configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL, // Default to localhost if CLIENT_URL is missing
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Test Route
app.get("/", (req, res) => {
  res.json({ success: true, message: "API is working!" });
});

// Import Routes
import userRoute from "./Routes/UserRoute.js";
import productRoute from "./Routes/ProductRoute.js";
import orderRoute from "./Routes/OrderRoute.js";
import bannerRoute from "./Routes/BannerRoute.js";
import bannersRoute from "./Routes/BannersRoute.js";
import categoryRoute from "./Routes/CategoryRoute.js";
import logoRoute from "./Routes/LogoDetailsRoute.js";
import couponRoute from "./Routes/CouponRoute.js";
import secondBannerRoute from "./Routes/SecondBannerRoute.js";
import thirdBannerRoute from "./Routes/ThirdBannerRoute.js";
import cartRoute from "./Routes/CartRoute.js";
import wishlistRoute from "./Routes/WishlistRoute.js";
import paypalRoute from "./Routes/PaymentRoute.js";
import reviewRoute from "./Routes/ReviewRoute.js";
import EventRoute from "./Routes/EventRoute.js";
import adminStaticsRoute from "./Routes/AdminStaticsRoute.js";


// Use Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/products", productRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/banner", bannerRoute);
app.use("/api/v1/banners", bannersRoute);
app.use("/api/v1/category", categoryRoute);
app.use("/api/v1/company-details", logoRoute);
app.use("/api/v1/coupon", couponRoute);
app.use("/api/v1/second-banner", secondBannerRoute);
app.use("/api/v1/third-banner", thirdBannerRoute);
app.use("/api/v1/cart", cartRoute);
app.use("/api/v1/wishlist", wishlistRoute);
app.use("/api/v1/payment", paypalRoute);
app.use("/api/v1/reviews", reviewRoute);
app.use("/api/v1/event", EventRoute);
app.use("/api/v1/adminstats", adminStaticsRoute);

// Use the custom error handling middleware
app.use(errorMiddleware);

// Error Handling Middleware (Fix `[object Object]` issue)
app.use((err, req, res, next) => {
  console.error("Middleware Error:", JSON.stringify(err, null, 2)); // Ensure proper logging

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Handle Unhandled Promise Rejections
process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Promise Rejection: ${err.message}`);
  console.log("Shutting down the server due to unhandled promise rejection");

  server.close(() => {
    process.exit(1);
  });
});
