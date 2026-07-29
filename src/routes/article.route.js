import { Router } from "express";
import { createArticle,allPublishedArticle } from "../controllers/article.controller.js";
import { protect, isRole } from "../middleware/protect.middleware.js";


const router = Router()

router.post("/create", protect, isRole(["author", "admin"]), createArticle )
router.get("/", allPublishedArticle)

export default router