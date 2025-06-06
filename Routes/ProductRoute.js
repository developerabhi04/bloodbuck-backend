import express from 'express';
import { deleteProduct, getAllProducts, getLowStockProducts, getNewArrivalProducts, getSimilarProducts, getSingleProduct, newProduct, updateProduct } from '../Controllers/ProductController.js';
import { authorizeRoles, isAuthenticatedUser } from '../middlewares/auth.js';


const router = express.Router();


router.post('/create-product', newProduct);

router.get('/get-all-products', getAllProducts);

router.get("/similar/:id", getSimilarProducts);

router.get('/new-arrivals', getNewArrivalProducts);


router.put("/update-product/:id", isAuthenticatedUser, authorizeRoles("admin"), updateProduct);

router.get('/low-stock', getLowStockProducts);

router.get("/get-single-product/:id", getSingleProduct);
router.delete("/delete-product/:id", isAuthenticatedUser, authorizeRoles("admin"), deleteProduct);

export default router;