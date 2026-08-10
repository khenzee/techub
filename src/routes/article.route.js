import { Router } from "express";
import { createArticle, allPublishedArticle, deleteArticle, singleArticle, updateArticle, getArticle } from "../controllers/article.controller.js";
import { protect, isRole } from "../middleware/protect.middleware.js";
import { uploadCloudinary } from "../middleware/upload.middleware.js";

const router = Router()

router.post("/create", protect, isRole(["author", "admin"]), uploadCloudinary.single("thumbnail"), createArticle)
router.get("/", allPublishedArticle)
router.get("/admin", protect, isRole(["admin"]), getArticle)
router.delete("/:id", protect, isRole(["author", "admin"]), deleteArticle)
router.patch("/:id", protect, isRole(["author"]), updateArticle)
router.get("/:id", protect, isRole(["admin"]), singleArticle)

export default router