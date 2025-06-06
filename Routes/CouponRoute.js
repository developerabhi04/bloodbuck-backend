import express from "express";
import { createCoupon, deleteCoupon, getAllCoupons, getSingleCoupon, updateCoupon, validateCoupon } from "../Controllers/CouponController.js";
import { authorizeRoles, isAuthenticatedUser } from "../middlewares/auth.js";

const router = express.Router();

// ✅ Create a new coupon (Admin Only)
// router.post("/admin/create", createCoupon);
router.post("/admin/create", createCoupon);


// ✅ Get all coupons
router.get("/public/all", getAllCoupons);

router.post("/validate", validateCoupon);

router.get("/public/get-coupon/:id", isAuthenticatedUser, authorizeRoles("admin"), getSingleCoupon);

router.put("/admin/update/:id", isAuthenticatedUser, authorizeRoles("admin"), updateCoupon);
router.delete("/admin/delete/:id",isAuthenticatedUser, authorizeRoles("admin"), deleteCoupon);

export default router;
