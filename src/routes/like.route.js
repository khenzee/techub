import { Router } from "express"
import { protect } from "../middleware/protect.middleware.js"
import { likeArticle, unlikeArticle, getArticleLikes, getMyLikes } from "../controllers/like.controller.js"

const router = Router()

router.post("/article/:articleId", protect, likeArticle)
router.delete("/article/:articleId", protect, unlikeArticle)
router.get("/article/:articleId", getArticleLikes)
router.get("/me", protect, getMyLikes)

export default router
