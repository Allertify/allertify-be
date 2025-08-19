import { Router } from "express";
import { registerController, verifyOtpController, loginController } from "../controllers/auth.controller";

const router = Router();

// endpoint register
router.post("/register", registerController);
// endpoint otp
router.post("/otp", verifyOtpController);
// endpoint login
router.post("/login", loginController);

export default router;