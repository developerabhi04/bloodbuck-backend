import express from "express";
import { createPayment, executePayment, getAllPayments } from "../Controllers/PaymentController.js";
import { authorizeRoles, isAuthenticatedUser } from "../middlewares/auth.js";

const router = express.Router();

// ✅ Create PayPal Payment
router.post("/create-payment", createPayment);

// ✅ Execute PayPal Payment
router.post("/execute-payment", executePayment);

// ✅ Get All Payments (Admin)
router.get("/all-payments",isAuthenticatedUser, authorizeRoles("admin"), getAllPayments);

export default router;
