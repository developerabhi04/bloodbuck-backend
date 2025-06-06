import express from "express";
import { addBanner, deleteBanner, getAllBanner, getSingleBanner, updateBanner } from "../Controllers/BannerController.js";
import { authorizeRoles, isAuthenticatedUser } from "../middlewares/auth.js";



const router = express.Router();


router.post("/admin/addbanner", isAuthenticatedUser, authorizeRoles("admin"), addBanner);
router.get("/public/getbanner", getAllBanner);

router.get("/public/getbanner/:id", getSingleBanner);

router.put("/admin/edit/:id", isAuthenticatedUser, authorizeRoles("admin"), updateBanner);
router.delete("/admin/delete/:id", isAuthenticatedUser, authorizeRoles("admin"), deleteBanner);


export default router;
