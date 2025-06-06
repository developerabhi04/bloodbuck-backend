import express from "express";
import { addSecondBanner, deleteSecondBanner, getAllSecondBanner, getSingleBanner, updateSecondBanner } from "../Controllers/SecondBannerController.js";
import { authorizeRoles, isAuthenticatedUser } from "../middlewares/auth.js";

const router = express.Router();


router.post("/admin/add-second-banner", isAuthenticatedUser, authorizeRoles("admin"), addSecondBanner);
router.get("/public/get-all-banner", getAllSecondBanner);

router.get("/public/getbanner/:id", getSingleBanner);

router.put("/admin/edit/:id", isAuthenticatedUser, authorizeRoles("admin"), updateSecondBanner);
router.delete("/admin/delete/:id", isAuthenticatedUser, authorizeRoles("admin"), deleteSecondBanner);


export default router;
