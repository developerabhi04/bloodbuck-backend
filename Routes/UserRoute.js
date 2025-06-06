import express from 'express';
import { deleteUser, getAllUsers, googleLogin, loginUser, registerUser, updateUserRole } from '../Controllers/UserController.js';
import { verifyGoogleToken } from '../database/firebaseAdmin.js';
import { authorizeRoles, isAuthenticatedUser } from '../middlewares/auth.js';



const router = express.Router();


router.post('/register', registerUser);
router.post('/login', loginUser);
router.post("/google-login", verifyGoogleToken, googleLogin);

router.get('/get-all-users', isAuthenticatedUser, authorizeRoles("admin"), getAllUsers);
router.put('/update-user-role/:id/role',isAuthenticatedUser, authorizeRoles('admin'), updateUserRole);

router.delete("/delete-user/:id", isAuthenticatedUser, authorizeRoles("admin"), deleteUser);



export default router;