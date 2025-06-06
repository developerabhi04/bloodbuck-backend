import Product from "../Models/ProductModel.js";
import { v2 as cloudinary } from "cloudinary";
// import { Review } from "../models/review.js";





// ✅ Convert file buffer to Base64
const getBase64 = (file) => {
    return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
};

// ✅ Upload multiple images to Cloudinary (Directly from memory)
export const uploadToCloudinary = async (files) => {
    if (!files || typeof files !== "object") {
        throw new Error("Invalid files structure");
    }

    const uploadedImages = [];

    for (const key in files) {
        for (const file of files[key]) {
            try {
                const base64File = getBase64(file); // Reuse the getBase64 function here
                const result = await cloudinary.uploader.upload(base64File, { folder: "banners" });
                uploadedImages.push({
                    public_id: result.public_id,
                    url: result.secure_url,
                });
            } catch (error) {
                console.error("Cloudinary upload error:", error);
                throw new Error("Cloudinary upload failed");
            }
        }
    }

    return uploadedImages;
};


// ✅ Delete images from Cloudinary
export const deleteFromCloudinary = async (publicIds) => {
    await Promise.all(publicIds.map(id => cloudinary.uploader.destroy(id)));
};




// order-reducer stock
export const reducerStock = async (orderItems) => {
    for (let i = 0; i < orderItems.length; i++) {
        const order = orderItems[i];
        const product = await Product.findById(order.productId);
        if (!product)
            throw new Error("Product Not Found");
        product.stock -= order.quantity;
        await product.save();
    }
};

export const calculatePercentage = (thisMonth, lastMonth) => {
    if (lastMonth === 0) {
        return thisMonth * 100;
    }
    const percent = (thisMonth / lastMonth) * 100;
    return Number(percent.toFixed(0));
};


export const getCategories = async ({ categories, productsCount }) => {
    const categoriesCountPromise = categories.map((category) => (Product.countDocuments({ category })));
    const categoriesCount = await Promise.all(categoriesCountPromise);
    // const categoriesCount = await Promise.all(
    //     categories.map((category) => Product.countDocuments({ category }))
    // )
    const categoryCount = [];
    categories.forEach((category, i) => {
        categoryCount.push({
            [category]: Math.round((categoriesCount[i] / productsCount) * 100),
        });
    });
    return categoryCount;
};
// 
export const getChartData = ({ length, docArr, today, property, }) => {
    // const today = new Date();
    const data = new Array(length).fill(0);
    docArr.forEach((i) => {
        const creationDate = i.createdAt;
        const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
        if (monthDiff < length) {
            if (property) {
                data[length - monthDiff - 1] += i[property];
            }
            else {
                data[length - monthDiff - 1] += 1;
            }
        }
    });
    return data;
};
