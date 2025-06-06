import { Category, SubCategory } from "../Models/CategoryModel.js";
import Product from "../Models/ProductModel.js";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import multer from "multer";
import cloudinary from "cloudinary";
import mongoose from "mongoose";
import ApiFeatures from "../utils/apiFeatures.js";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadFileToCloudinary = (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error) return reject(error);
                resolve({
                    public_id: result.public_id,
                    url: result.secure_url,
                });
            }
        ).end(fileBuffer);
    });
};

// Delete images from Cloudinary
const deleteFromCloudinary = async (publicIds) => {
    try {
        await Promise.all(publicIds.map(id => cloudinary.v2.uploader.destroy(id)));
    } catch (error) {
        console.error("Error deleting images from Cloudinary:", error);
    }
};


export const newProduct = [upload.any(), async (req, res) => {
    try {
        const { name, price, category, subcategory, description } = req.body;

        // Validate category and subcategory
        const categoryExists = await Category.findById(category);
        if (!categoryExists)
            return res.status(400).json({ message: "Invalid Category" });

        const subCategoryExists = await SubCategory.findById(subcategory);
        if (!subCategoryExists)
            return res.status(400).json({ message: "Invalid Subcategory" });

        // Process color variants
        const numColorVariants = parseInt(req.body.numColorVariants, 10) || 0;
        let colors = [];

        for (let i = 0; i < numColorVariants; i++) {
            const colorName = req.body[`colorName${i}`] || `Color ${i + 1}`;
            const stock = parseInt(req.body[`colorStock${i}`], 10) || 0;



            // Upload dedicated colour image if provided (field name: `colorImage${i}`)
            let colorImage = null;
            const dedicatedFile = req.files.find(
                (file) => file.fieldname === `colorImage${i}`
            );
            if (dedicatedFile) {
                colorImage = await uploadFileToCloudinary(dedicatedFile.buffer, "colorImages");
            }

            // Upload additional variant images (field name: `colorImages${i}`)
            const colorFiles = req.files.filter(
                (file) => file.fieldname === `colorImages${i}`
            );
            let colorPhotos = [];
            if (colorFiles.length > 0) {
                colorPhotos = await Promise.all(
                    colorFiles.map(async (file) =>
                        await uploadFileToCloudinary(file.buffer, "colors")
                    )
                );
            }

            colors.push({
                colorName,
                colorImage, // Dedicated colour image object (or null)
                photos: colorPhotos,
                stock,
            });
        }

        // Create and save the new product
        const newProd = new Product({
            name,
            price,
            description,
            category,
            subcategory,
            colors,
        });

        await newProd.save();

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product: newProd,
        });
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}];




export const updateProduct = [
    upload.any(),
    catchAsyncErrors(async (req, res) => {
        try {
            const { id } = req.params;
            const { name, price, category, subcategory, description } = req.body;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid Product ID" });
            }

            const product = await Product.findById(id);
            if (!product) return res.status(404).json({ message: "Product not found" });

            // Validate and assign category
            if (category) {
                if (!mongoose.Types.ObjectId.isValid(category)) {
                    return res.status(400).json({ message: "Invalid Category ID" });
                }
                const categoryExists = await Category.findById(category);
                if (!categoryExists)
                    return res.status(400).json({ message: "Category not found" });
                product.category = category;
            }

            // Validate and assign subcategory
            if (subcategory) {
                if (!mongoose.Types.ObjectId.isValid(subcategory)) {
                    return res.status(400).json({ message: "Invalid Subcategory ID" });
                }
                const subCategoryExists = await SubCategory.findById(subcategory);
                if (!subCategoryExists)
                    return res.status(400).json({ message: "Subcategory not found" });
                product.subcategory = subcategory;
            }

            // If new color images provided, delete old ones
            if (req.files.some(file => file.fieldname.startsWith("colorImages") || file.fieldname.startsWith("colorImage"))) {
                const allPublicIds = [];

                product.colors.forEach(color => {
                    if (color.colorImage?.public_id) {
                        allPublicIds.push(color.colorImage.public_id);
                    }
                    if (color.photos?.length) {
                        color.photos.forEach(photo => {
                            if (photo.public_id) allPublicIds.push(photo.public_id);
                        });
                    }
                });

                if (allPublicIds.length > 0) await deleteFromCloudinary(allPublicIds);

                // Reconstruct new color variants
                const numColorVariants = parseInt(req.body.numColorVariants, 10) || 0;
                let updatedColors = [];

                for (let i = 0; i < numColorVariants; i++) {
                    const colorName = req.body[`colorName${i}`]?.trim() || `Color ${i + 1}`;
                    const stock = parseInt(req.body[`colorStock${i}`], 10) || 0;

                    // Dedicated image
                    let colorImage = null;
                    const dedicatedFile = req.files.find(file => file.fieldname === `colorImage${i}`);
                    if (dedicatedFile) {
                        colorImage = await uploadFileToCloudinary(dedicatedFile.buffer, "colorImages");
                    }

                    // Variant photos
                    const colorFiles = req.files.filter(file => file.fieldname === `colorImages${i}`);
                    let colorPhotos = [];
                    if (colorFiles.length > 0) {
                        colorPhotos = await Promise.all(
                            colorFiles.map(file => uploadFileToCloudinary(file.buffer, "colors"))
                        );
                    }

                    updatedColors.push({
                        colorName,
                        stock,
                        colorImage,
                        photos: colorPhotos,
                    });
                }

                product.colors = updatedColors;
            }

            // Update basic fields
            if (name) product.name = name;
            if (price) product.price = price;
            if (description) product.description = description;

            await product.save();

            res.status(200).json({
                success: true,
                message: "Product updated successfully",
                product,
            });
        } catch (error) {
            console.error("Error updating product:", error);
            res.status(500).json({ message: "Server error", error: error.message });
        }
    })
];



export const getLowStockProducts = catchAsyncErrors(async (req, res) => {
    // Low-stock endpoint should be reworked to calculate overall stock from variant stocks if needed.
    try {
        res.status(200).json({ success: true, products: [] });
    } catch (error) {

    }

});


export const deleteProduct = catchAsyncErrors(async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product Not Found" });

        // Delete color photos from Cloudinary
        if (product.colors && product.colors.length > 0) {
            const colorPublicIds = [];
            product.colors.forEach(color => {
                if (color.photos && color.photos.length > 0) {
                    color.photos.forEach(photo => {
                        if (photo.public_id) colorPublicIds.push(photo.public_id);
                    });
                }
            });
            if (colorPublicIds.length > 0) {
                await deleteFromCloudinary(colorPublicIds);
            }
        }

        await product.deleteOne();

        res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


export const getSimilarProducts = catchAsyncErrors(async (req, res) => {
    const { id } = req.params;
    // Find the current product by ID
    const currentProduct = await Product.findById(id);
    if (!currentProduct) {
        return res.status(404).json({ success: false, message: "Product not found" });
    }
    // Find similar products: same category but with different _id
    const similarProducts = await Product.find({
        category: currentProduct.category,
        _id: { $ne: currentProduct._id },
    })
        .limit(4)
        .populate("category", "name")
        .populate("subcategory", "name");

    res.status(200).json({
        success: true,
        products: similarProducts,
    });
});



export const getAllProducts = catchAsyncErrors(async (req, res) => {
    const apiFeature = new ApiFeatures(Product.find(), req.query)
        .search()
        .categoryFilter()
        .colorFilter()
        .priceFilter()
        .filter()
        .sort();

    const products = await apiFeature.query
        .populate("category", "name")
        .populate("subcategory", "name");

    res.status(200).json({
        success: true,
        products,
    });
});



export const getSingleProduct = catchAsyncErrors(async (req, res) => {
    try {
        if (!req.params.id || req.params.id.length !== 24) {
            return res.status(400).json({ message: "Invalid Product ID" });
        }
        const product = await Product.findById(req.params.id)
            .populate("category", "name")
            .populate("subcategory", "name")
            .populate("reviews.user", "name avatar");

        if (!product) {
            return res.status(404).json({ success: false, message: "Product Not Found" });
        }

        res.status(200).json({ success: true, product });
    } catch (error) {
        console.error("Error Fetching Product:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

export const getNewArrivalProducts = catchAsyncErrors(async (req, res) => {
    let query = {};
    if (req.query.color) {
        query = { "colors.colorName": { $regex: new RegExp(req.query.color, "i") } };
    }
    const products = await Product.find(query).sort({ createdAt: -1 }).limit(10);
    res.status(200).json({
        success: true,
        products,
    });
});
