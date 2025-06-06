import express from "express";
import { addThirdBanner, deleteThirdBanner, getAllThirdBanner, getSingleBanner, updateThirdBanner } from "../Controllers/ThirdBannerController.js";
import { authorizeRoles, isAuthenticatedUser } from "../middlewares/auth.js";

const router = express.Router();


router.post("/admin/add-third-banner", isAuthenticatedUser, authorizeRoles("admin"), addThirdBanner);
router.get("/public/get-all-banner", getAllThirdBanner);

router.get("/public/getbanner/:id", getSingleBanner);

router.put("/admin/edit/:id", isAuthenticatedUser, authorizeRoles("admin"), updateThirdBanner);
router.delete("/admin/delete/:id", isAuthenticatedUser, authorizeRoles("admin"), deleteThirdBanner);


export default router;
