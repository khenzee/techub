import { Router } from "express"
import { protect } from "../middleware/protect.middleware.js"
import { getProfile, updateProfile } from "../controllers/user.controller.js"

const router = Router()

router.get("/profile", protect, getProfile)
router.patch("/profile", protect, updateProfile)

export default router
