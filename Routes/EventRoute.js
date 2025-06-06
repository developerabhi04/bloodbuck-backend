import express from 'express';
import multer from 'multer';
import { addBanner, addProduct, deleteBanner, deleteProduct, getAllBanners, getAllProducts, getSingleBanner, getSingleProduct, updateBanner, updateProduct } from '../Controllers/EventController.js';
import { authorizeRoles, isAuthenticatedUser } from '../middlewares/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// public
router.get('/public/banners', getAllBanners);
router.get('/public/banners/:id', getSingleBanner);
// admin
router.post(
  '/admin/banners',
  isAuthenticatedUser,
  authorizeRoles('admin'),
  upload.single('banner'),
  ...addBanner
);
router.put(
  '/admin/banners/:id',
  isAuthenticatedUser,
  authorizeRoles('admin'),
  upload.single('banner'),
  ... updateBanner
);
router.delete(
  '/admin/banners/:id',
  isAuthenticatedUser,
  authorizeRoles('admin'),
  deleteBanner
);




// public
router.get('/public/products', getAllProducts);
router.get('/public/products/:id', getSingleProduct);
// admin
router.post(
  '/admin/products',
  isAuthenticatedUser,
  authorizeRoles('admin'),
  upload.array('photos', 5),
  ...addProduct
);

router.put(
  '/admin/products/:id',
  isAuthenticatedUser,
  authorizeRoles('admin'),
  upload.array('photos', 5),
  ...updateProduct
);

router.delete(
  '/admin/products/:id',
  isAuthenticatedUser,
  authorizeRoles('admin'),
  deleteProduct
);

export default router;
