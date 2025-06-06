import ErrorHandler from "../middlewares/errorHandling.js";
import Order from "../Models/OrderModel.js";
import Product from "../Models/ProductModel.js";
import { reducerStock } from "../utils/features.js";


// ✅ Create New Order (PayPal Only)
export const newOrder = async (req, res, next) => {
    try {
        const { user, cartItems, shippingDetails, subtotal, tax, total, discount, discountAmount, paymentMethod } = req.body; // Include paymentMethod

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: "Cart is empty!" });
        }

        const { fullName, address, city, state, zipCode, phoneNumber, email } = shippingDetails;
        if (!fullName || !address || !city || !state || !zipCode || !phoneNumber || !email) {
            return res.status(400).json({ message: "All fields are required shippingDetails" });
        }


        for (const item of cartItems) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return next(new ErrorHandler(`Product not found: ${item.productId}`, 404));
            }
            if (product.stock < item.quantity) {
                return next(
                    new ErrorHandler(
                        `Not enough stock for ${product.name}! Available: ${product.stock}, Requested: ${item.quantity}`,
                        400
                    )
                );
            }
        }


        // Ensure paymentMethod is "Online" for PayPal
        if (paymentMethod !== "Paypal") {
            return res.status(400).json({ message: "Only paypal payments are accepted." });
        }

        const newOrder = new Order({
            user,
            cartItems,
            shippingDetails,
            subtotal,
            tax,
            total,
            discount,
            discountAmount,
            paymentMethod, // Use the paymentMethod from the request body
            status: "Pending",
        });

        await newOrder.save();

        await reducerStock(cartItems);

        res.status(201).json({
            message: "Order created successfully! Proceed to PayPal for payment.",
            orderId: newOrder._id,
            estimatedDelivery: "5-7 business days",
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// ✅ Get My Orders
export const myOrder = async (req, res, next) => {
    try {
        const { id: user } = req.query;
        const orders = await Order.find({ user });

        return res.status(200).json({
            success: true,
            orders,
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// ✅ Get All Orders (Admin)
export const allOrders = async (req, res, next) => {
    try {
        const orders = await Order.find()
            .populate("user", "name email phone") // ✅ Fetch user details
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            orders,
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// ✅ Get Single Order
export const getSingleOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id)
            .populate("user", "name email phone");

        if (!order) {
            return next(new ErrorHandler("Order Not Found", 404));
        }

        return res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// ✅ Update Order Status (Processing -> Shipped -> Delivered)
export const processOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);

        if (!order) {
            return next(new ErrorHandler("Order Not Found", 404));
        }

        // ✅ Change order status
        switch (order.status) {
            case "Pending":
                order.status = "Processing";
                break;
            case "Processing":
                order.status = "Shipped";
                break;
            case "Shipped":
                order.status = "Delivered";
                break;
            default:
                order.status = "Delivered";
                break;
        }

        await order.save();

        return res.status(200).json({
            success: true,
            message: `Order marked as ${order.status}`,
            order,
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// ✅ Delete Order (Admin)
export const deleteOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);

        if (!order) {
            return next(new ErrorHandler("Order Not Found", 404));
        }

        // ✅ Restore stock when an order is canceled
        for (const item of order.cartItems) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
        }

        await order.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Order Deleted Successfully",
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};


// ✅ Get All Orders (Admin)
export const allLatestOrders = async (req, res, next) => {
    try {
        const orders = await Order.find()
            .populate({
                path: "user",
                select: "name email phone", // ✅ Fetch user details
            })
            .populate({
                path: "cartItems.productId", // ✅ Fix incorrect accessor
                select: "name photos price",
            }) // ✅ Populate product details
            .sort({ createdAt: -1 }); // ✅ Apply sorting before executing query

        return res.status(200).json({
            success: true,
            orders,
        });
    } catch (error) {
        next(error); // ✅ Pass to global error handler
    }
};