import mongoose from "mongoose";
import Cart from "../Models/CartModel.js";
import Product from "../Models/ProductModel.js";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";

// -----------------------------------------------------------------------------
// Add an item to the cart
// -----------------------------------------------------------------------------
// Add to Cart

export const addToCart = async (req, res) => {
    try {
        const { userId, productId, quantity, sizes, seamSizes, colorName } = req.body;
        if (!userId || !productId || quantity <= 0 || !colorName) {
            return res.status(400).json({ success: false, message: "Invalid data provided!" });
        }
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: "Invalid ID format!" });
        }
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }
        // Check if same variant exists
        const existingItemIndex = cart.items.findIndex(
            (item) =>
                item.productId.toString() === productId &&
                String(item.sizes) === String(sizes) &&
                String(item.seamSizes) === String(seamSizes) &&
                item.colorName === colorName
        );
        if (existingItemIndex === -1) {
            cart.items.push({
                productId,
                quantity,
                sizes: sizes || null,
                seamSizes: seamSizes || null,
                colorName,
            });
        } else {
            cart.items[existingItemIndex].quantity += quantity;
        }
        await cart.save();
        res.status(200).json({ success: true, message: "Item added to cart successfully!", cart });
    } catch (error) {
        console.error("Error in addToCart:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


// -----------------------------------------------------------------------------
// Fetch Cart Items with full product and variant details
// -----------------------------------------------------------------------------
export const fetchCartItems = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid or missing user ID" });
        }
        // Populate product details – include colors so nested sizes and seamSizes come through.
        const cart = await Cart.findOne({ userId }).populate({
            path: "items.productId",
            select: "name photos price colors",
        });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found!" });
        }
        // Remove items with missing product details
        const validItems = cart.items.filter((item) => item.productId);
        if (validItems.length < cart.items.length) {
            cart.items = validItems;
            await cart.save();
        }
        // Map cart items to include variant details:
        const populatedItems = cart.items.map((item) => {
            const product = item.productId;
            const variant = product.colors.find((c) => c.colorName === item.colorName) || {};
            return {
                productId: product._id,
                name: product.name,
                imageUrl:
                    variant.photos && variant.photos.length > 0
                        ? variant.photos[0].url
                        : product.photos && product.photos.length > 0
                            ? product.photos[0].url
                            : null,
                price: product.price,
                colorOptions: product.colors.map((c) => c.colorName),
                sizeOptions: variant.sizes || [],
                seamSizeOptions: variant.seamSizes || [],
                // Map stored fields to names that the frontend expects:
                selectedSize: item.sizes || null,
                selectedSeamSize: item.seamSizes || null,
                selectedColorName: item.colorName,
                quantity: item.quantity,
            };
        });
        res.status(200).json({ success: true, data: populatedItems });
    } catch (error) {
        console.error("Error in fetchCartItems:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// -----------------------------------------------------------------------------
// Update Cart Item Quantity
// -----------------------------------------------------------------------------
export const updateCartItemQty = async (req, res) => {
    try {
        const { userId, productId, sizes, seamSizes, quantity, colorName } = req.body;
        if (!userId || !productId || quantity <= 0 || !colorName) {
            return res.status(400).json({ success: false, message: "Invalid data provided!" });
        }
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found!" });
        }
        const existingItem = cart.items.find(
            (item) =>
                item.productId.toString() === productId &&
                String(item.sizes) === String(sizes) &&
                String(item.seamSizes) === String(seamSizes) &&
                item.colorName === colorName
        );
        if (!existingItem) {
            return res.status(404).json({ success: false, message: "Item not found in cart!" });
        }
        existingItem.quantity = quantity;
        await cart.save();
        const populatedCart = await Cart.findOne({ userId }).populate({
            path: "items.productId",
            select: "name photos price colors",
        });
        res.status(200).json({ success: true, message: "Cart item updated successfully!", cart: populatedCart });
    } catch (error) {
        console.error("Error updating cart item quantity:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


// -----------------------------------------------------------------------------
// Delete a Cart Item
// -----------------------------------------------------------------------------
export const deleteCartItem = async (req, res) => {
    try {
        const { userId, productId } = req.params;
        let { sizes, seamSizes, colorName } = req.query;
        if (!userId || !productId) {
            return res.status(400).json({ success: false, message: "UserId and productId are required!" });
        }
        if (!colorName) {
            return res.status(400).json({ success: false, message: "ColorName is required!" });
        }
        sizes = sizes === undefined || sizes === "undefined" || sizes === "null" ? null : sizes;
        seamSizes =
            seamSizes === undefined || seamSizes === "undefined" || seamSizes === "null"
                ? null
                : isNaN(seamSizes)
                    ? seamSizes
                    : Number(seamSizes);
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found!" });
        }
        const initialLength = cart.items.length;
        cart.items = cart.items.filter((item) => {
            const sizeMatch = String(item.sizes) === String(sizes);
            const seamSizeMatch = String(item.seamSizes) === String(seamSizes);
            return !(
                item.productId.toString() === productId &&
                sizeMatch &&
                seamSizeMatch &&
                item.colorName === colorName
            );
        });
        if (cart.items.length === initialLength) {
            return res.status(404).json({ success: false, message: "Item not found in cart!" });
        }
        await cart.save();
        res.status(200).json({ success: true, message: "Cart item deleted successfully!", cart });
    } catch (error) {
        console.error("Error deleting cart item:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// -----------------------------------------------------------------------------
// Clear Ordered Products from the Cart
// -----------------------------------------------------------------------------
export const clearOrderedProducts = async (req, res) => {
    const { userId } = req.params;
    const { orderedItems } = req.body; // Array of ordered product IDs
    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found!" });
        }
        cart.items = cart.items.filter(
            (item) => !orderedItems.includes(item.productId.toString())
        );
        await cart.save();
        res.status(200).json({
            success: true,
            message: "Ordered products removed from the cart successfully!",
            cart,
        });
    } catch (error) {
        console.error("Error clearing ordered products:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
