import express from "express";
import { addCategory, addSubCategory, deleteCategory, deleteSubCategory, getAllCategories, updateCategory, updateSubCategory } from "../Controllers/CategoryController.js";
import { authorizeRoles, isAuthenticatedUser } from "../middlewares/auth.js";
const router = express.Router();

// ✅ Category Routes
router.post("/admin/category/add", addCategory);
router.get("/public/category/all", getAllCategories);
router.put("/admin/category/update/:id", isAuthenticatedUser, authorizeRoles("admin"), updateCategory);
router.delete("/admin/category/delete/:id", isAuthenticatedUser, authorizeRoles("admin"), deleteCategory);

// ✅ Subcategory Routes
router.post("/admin/subcategory/add", isAuthenticatedUser, authorizeRoles("admin"), addSubCategory);
router.put("/admin/subcategory/update/:id", isAuthenticatedUser, authorizeRoles("admin"), updateSubCategory);
router.delete("/admin/subcategory/delete/:id", isAuthenticatedUser, authorizeRoles("admin"), deleteSubCategory);

export default router;
