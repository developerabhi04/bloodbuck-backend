import express from "express";
import { addCompanyInfo, deleteCompanyInfo, getCompanyInfo, getSingleCompanyInfo, updateCompanyInfo } from "../Controllers/LogoDetailsController.js";
import { authorizeRoles, isAuthenticatedUser } from "../middlewares/auth.js";


const router = express.Router();

router.post("/admin/add-company", isAuthenticatedUser, authorizeRoles("admin"), addCompanyInfo);
router.get("/public/company", getCompanyInfo);
router.get("/public/get-company-info/:id", isAuthenticatedUser, authorizeRoles("admin"), getSingleCompanyInfo);


router.put("/admin/edit/:id", isAuthenticatedUser, authorizeRoles("admin"), updateCompanyInfo);
router.delete("/admin/delete/:id", isAuthenticatedUser, authorizeRoles("admin"), deleteCompanyInfo);


export default router;
