import { Router } from "express"
import { protect, isRole } from "../middleware/protect.middleware.js"
import { createCategory, getCategories, getCategory, updateCategory, deleteCategory } from "../controllers/category.controller.js"

const router = Router()

router.post("/create", protect, isRole(["admin"]), createCategory)
router.get("/", getCategories)
router.get("/:id", getCategory)
router.patch("/:id", protect, isRole(["admin"]), updateCategory)
router.delete("/:id", protect, isRole(["admin"]), deleteCategory)

export default router
