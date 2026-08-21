import { Router } from "express";
import { Register, Login } from "../controllers/auth.controller.js";
import { uploadCloudinary } from "../middleware/upload.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { registerSchema } from "../validation/auth.validation.js";

const router = Router()

router.post("/register", validater(registerSchema), uploadCloudinary.single("avatar"), Register )
router.post("/login", Login)


export default router