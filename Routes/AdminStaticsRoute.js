import express from "express";
import { getBarCharts, getDashboardStats, getLineCharts, getPieCharts } from "../Controllers/AdminStaticsController.js";
import { authorizeRoles, isAuthenticatedUser } from "../middlewares/auth.js";


const router = express.Router();

// route - /api/v1/dashboard/stats
router.get("/stats",isAuthenticatedUser, authorizeRoles("admin"), getDashboardStats);

// route - /api/v1/dashboard/pie
router.get("/pie",isAuthenticatedUser, authorizeRoles("admin"), getPieCharts);

// route - /api/v1/dashboard/bar
router.get("/bar",isAuthenticatedUser, authorizeRoles("admin"), getBarCharts);

// route - /api/v1/dashboard/line
router.get("/line",isAuthenticatedUser, authorizeRoles("admin"), getLineCharts);



export default router;