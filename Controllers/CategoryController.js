import slugify from "slugify";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import { Category, SubCategory } from "../Models/CategoryModel.js";
import cloudinary from "cloudinary";
import multer from "multer";

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

const deleteFromCloudinary = async (publicIds) => {
    try {
        await Promise.all(publicIds.map(id => cloudinary.v2.uploader.destroy(id)));
    } catch (error) {
        console.error("Error deleting images from Cloudinary:", error);
    }
};

// ✅ Add a New Category
export const addCategory = [
    upload.fields([{ name: 'photos', maxCount: 1 }]),
    catchAsyncErrors(async (req, res) => {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "Category name is required" });
        }

        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ success: false, message: "Category already exists" });
        }

        let photos = [];
        if (req.files?.photos) {
            photos = await Promise.all(
                req.files.photos.map(async (file) => await uploadFileToCloudinary(file.buffer, 'category'))
            );
        }

        // Create the category with a slug generated from its name
        const category = await Category.create({
            name,
            slug: slugify(name),
            photos,
        });

        res.status(201).json({
            success: true,
            message: "Category added successfully",
            category,
        });
    })
];

// ✅ Add a New Subcategory
export const addSubCategory = catchAsyncErrors(async (req, res) => {
    const { name, categoryId } = req.body;

    if (!name || !categoryId) {
        return res.status(400).json({ success: false, message: "Both category ID and subcategory name are required" });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
        return res.status(404).json({ success: false, message: "Category not found" });
    }

    const subCategory = await SubCategory.create({ name, category: categoryId });

    // Add the subcategory ID to the category's subcategories list
    category.subcategories.push(subCategory._id);
    await category.save();

    res.status(201).json({
        success: true,
        message: "Subcategory added successfully",
        subCategory,
    });
});

// ✅ Get All Categories with Subcategories
export const getAllCategories = catchAsyncErrors(async (req, res) => {
    const categories = await Category.find().populate("subcategories");

    res.status(200).json({
        success: true,
        categories,
    });
});

// ✅ Update Category
export const updateCategory = [
    upload.fields([{ name: 'photos', maxCount: 1 }]),
    catchAsyncErrors(async (req, res) => {
        const { name } = req.body;
        const { id } = req.params;

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        if (req.files?.photos) {
            // Delete old photos from Cloudinary
            if (category.photos && category.photos.length > 0) {
                const publicIds = category.photos.map(photo => photo.public_id);
                await deleteFromCloudinary(publicIds);
            }
            // Upload new photos
            category.photos = await Promise.all(
                req.files.photos.map(async (file) => await uploadFileToCloudinary(file.buffer, 'category'))
            );
        }

        // Update the category name and regenerate the slug if needed
        category.name = name || category.name;
        category.slug = slugify(category.name);

        await category.save();

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category,
        });
    })
];

// ✅ Update Subcategory
export const updateSubCategory = catchAsyncErrors(async (req, res) => {
    const { name, categoryId } = req.body;
    const { id } = req.params;

    const subCategory = await SubCategory.findById(id);
    if (!subCategory) {
        return res.status(404).json({ success: false, message: "Subcategory not found" });
    }

    subCategory.name = name || subCategory.name;
    if (categoryId) subCategory.category = categoryId;
    await subCategory.save();

    res.status(200).json({
        success: true,
        message: "Subcategory updated successfully",
        subCategory,
    });
});

// ✅ Delete Category
export const deleteCategory = catchAsyncErrors(async (req, res) => {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
        return res.status(404).json({ success: false, message: "Category not found" });
    }

    // Delete all subcategories under this category
    await SubCategory.deleteMany({ category: id });

    await category.deleteOne();

    res.status(200).json({
        success: true,
        message: "Category deleted successfully",
    });
});

// ✅ Delete Subcategory
export const deleteSubCategory = catchAsyncErrors(async (req, res) => {
    const { id } = req.params;

    const subCategory = await SubCategory.findById(id);
    if (!subCategory) {
        return res.status(404).json({ success: false, message: "Subcategory not found" });
    }

    await subCategory.deleteOne();

    res.status(200).json({
        success: true,
        message: "Subcategory deleted successfully",
    });
});
