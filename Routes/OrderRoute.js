import express from "express";
import {
    allLatestOrders,
    allOrders,
    deleteOrder,
    getSingleOrder,
    myOrder,
    newOrder,
    processOrder,
} from "../Controllers/OrderController.js";
import { authorizeRoles, isAuthenticatedUser } from "../middlewares/auth.js";

const router = express.Router();

// ✅ Create New Order (Only Authenticated Users)
router.post("/new-order", isAuthenticatedUser, newOrder);

// ✅ Get My Orders (Only Authenticated Users)
router.get("/my-order", isAuthenticatedUser, myOrder);

// ✅ Get All Orders (Admin Only)
router.get("/all-orders", isAuthenticatedUser, authorizeRoles("admin"), allOrders);

// ✅ Get All Latest Orders (Admin Only)
router.get("/all-latest-orders", isAuthenticatedUser, authorizeRoles("admin"), allLatestOrders);

// ✅ Get Single Order by ID (User or Admin)
router.get("/get-single-order/:id", isAuthenticatedUser, authorizeRoles("admin"), getSingleOrder);

// ✅ Update Order Status (Admin Only)
router.put("/order-status-process/:id", isAuthenticatedUser, authorizeRoles("admin"), processOrder);

// ✅ Delete Order by ID (Admin Only)
router.delete("/delete-order/:id", isAuthenticatedUser, authorizeRoles("admin"), deleteOrder);

export default router;
