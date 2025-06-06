import Order from "../Models/OrderModel.js";
import Payment from "../Models/PaymentModel.js";
import paypal from "../database/paypal.js";


// ✅ Create PayPal Payment
export const createPayment = async (req, res) => {
    const { orderId } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const paymentJson = {
            intent: "sale",
            payer: { payment_method: "paypal" },
            redirect_urls: {
                return_url: `${process.env.CLIENT_URL}/payment-success`,
                cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
            },
            transactions: [
                {
                    amount: { total: order.total.toFixed(2), currency: "USD" },
                    description: `Payment for order ${order._id}`,
                },
            ],
        };

        paypal.payment.create(paymentJson, (error, payment) => {
            if (error) {
                console.error("PayPal Payment Error:", error);
                return res.status(500).json({ success: false, message: error.message });
            }

            const approvalUrl = payment.links.find((link) => link.rel === "approval_url").href;

            res.status(200).json({
                success: true,
                approvalUrl,
                paymentId: payment.id,
            });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ✅ Execute PayPal Payment
export const executePayment = async (req, res) => {
    const { paymentId, payerId, orderId } = req.body;

    try {
        paypal.payment.execute(paymentId, { payer_id: payerId }, async (error, payment) => {
            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ success: false, message: "Order not found" });
            }

            order.status = "Paid";
            await order.save();

            const newPayment = await Payment.create({
                orderId,
                paymentId,
                payerId,
                status: "Completed",
                amount: payment.transactions[0].amount.total,
                currency: payment.transactions[0].amount.currency,
            });

            res.status(200).json({
                success: true,
                message: "Payment successful",
                paymentDetails: newPayment,
            });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



// ✅ Get All Payments (Admin)
export const getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find().populate("orderId", "user cartItems total");

        res.status(200).json({
            success: true,
            payments,
        });
    } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
