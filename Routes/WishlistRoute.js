// routes/WishlistRoutes.js
import express from "express";
import { addToWishlist, removeFromWishlist, getWishlist, moveWishlistToCart } from "../Controllers/WishlistController.js";
import { isAuthenticatedUser } from "../middlewares/auth.js";

const router = express.Router();

router.post("/add", isAuthenticatedUser, addToWishlist);
router.post("/move-to-cart", isAuthenticatedUser, moveWishlistToCart);
router.delete("/delete/:userId/:productId", removeFromWishlist);
router.get("/:userId", isAuthenticatedUser, getWishlist);

export default router;
