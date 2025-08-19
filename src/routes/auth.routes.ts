import { Router } from "express";
import { registerController, verifyOtpController } from "../controllers/auth.controller";

const router = Router();

// endpoint register
router.post("/register", registerController);
// endpoint otp
router.post("/otp", verifyOtpController);

export default router;