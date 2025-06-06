import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },
        paymentId: {
            type: String,
            required: true,
        },
        payerId: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["Pending", "Completed", "Failed"],
            default: "Pending",
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "USD",
        },
    },
    { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
