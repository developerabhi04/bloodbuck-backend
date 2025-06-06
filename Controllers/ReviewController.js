import Order from "../Models/OrderModel.js";
import Product from "../Models/ProductModel.js";

// Submit a Review – Only allowed if the user has a delivered order that hasn't been reviewed yet
export const submitReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = req.user._id;

        // Validate input
        if (!productId || rating === undefined || comment.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Product ID, rating and comment are all required.",
            });
        }

        if (typeof rating !== "number" || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be a number between 1 and 5.",
            });
        }

        // Check if the user has a delivered order for this product where the item is not reviewed yet
        const deliveredOrder = await Order.findOne({
            user: userId,
            status: "Delivered",
            "cartItems.productId": productId,
            "cartItems.reviewed": false,
        });

        if (!deliveredOrder) {
            return res.status(400).json({
                success: false,
                message:
                    "You are not allowed to review this product. Either it hasn't been delivered or you have already reviewed it.",
            });
        }

        // Find the product being reviewed
        const product = await Product.findById(productId).populate("reviews.user", "name avatar");
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Create the review object
        const review = {
            user: userId,
            rating,
            comment,
            createdAt: new Date(),
        };

        // Add the review and update the average rating
        product.reviews.push(review);
        product.averageRating =
            product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length;
        await product.save();

        // Mark the cart items for this product as reviewed in the delivered order
        deliveredOrder.cartItems = deliveredOrder.cartItems.map((item) => {
            if (String(item.productId) === String(productId)) {
                item.reviewed = true;
            }
            return item;
        });
        await deliveredOrder.save();

        return res.status(200).json({ success: true, review });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


// Get Reviews for a Product using a query parameter ?productId=
export const getReviews = async (req, res) => {
    try {
        const { productId } = req.query;
        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required.",
            });
        }
        // Populate both the user's name and photo fields
        const product = await Product.findById(productId).populate("reviews.user", "name photo");
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
        return res.status(200).json({
            success: true,
            reviews: product.reviews,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


// Delete a Review (Admin Only)
export const deleteReview = async (req, res, next) => {
    try {
        const { productId, reviewId } = req.params;

        // Find the product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Remove the review with the given reviewId from the reviews array
        product.reviews = product.reviews.filter(
            (review) => review._id.toString() !== reviewId
        );

        // Recalculate the average rating after deletion
        product.averageRating =
            product.reviews.length > 0
                ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
                : 0;

        await product.save();

        return res.status(200).json({
            success: true,
            message: "Review deleted successfully.",
        });
    } catch (error) {
        next(error);
    }
};
