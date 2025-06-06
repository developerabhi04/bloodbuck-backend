import express from "express"
import { addToCart, clearOrderedProducts, deleteCartItem, fetchCartItems, updateCartItemQty } from "../Controllers/CartController.js";
import { authorizeRoles, isAuthenticatedUser } from "../middlewares/auth.js";



const router = express.Router();

router.post("/add", addToCart);
router.get("/get/:userId", fetchCartItems);
router.put("/update", updateCartItemQty);
router.delete("/delete/:userId/:productId", isAuthenticatedUser, deleteCartItem);
router.delete("/clear-order/:userId", isAuthenticatedUser, authorizeRoles("admin"), clearOrderedProducts);

export default router;