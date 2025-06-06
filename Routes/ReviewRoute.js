import express from "express";
import { deleteReview, getReviews, submitReview } from "../Controllers/ReviewController.js";
import { authorizeRoles, isAuthenticatedUser } from "../middlewares/auth.js";
// import { isAuthenticatedUser } from "../middlewares/auth.js";


const router = express.Router();

// ✅ Submit a Review (Authenticated User Only)
router.post("/post-review", isAuthenticatedUser, submitReview);

// ✅ Get Reviews for a Product
router.get("/get-review", getReviews);

// ✅ Delete Review (Admin Only)
router.delete("/:productId/reviews/:reviewId", isAuthenticatedUser, authorizeRoles("admin"), deleteReview);

export default router;
