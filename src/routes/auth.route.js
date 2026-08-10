import { Router } from "express";
import { Register, Login } from "../controllers/auth.controller.js";
import { uploadCloudinary } from "../middleware/upload.middleware.js";

const router = Router()

router.post("/register", uploadCloudinary.single("avatar"), Register )
router.post("/login", Login)


export default router