import { Router } from "express"
import { protect } from "../middleware/protect.middleware.js"
import { addComment, getCommentsByArticle, deleteComment } from "../controllers/comment.controller.js"

const router = Router()

router.post("/create", protect, addComment)
router.get("/article/:articleId", getCommentsByArticle)
router.delete("/:id", protect, deleteComment)

export default router
