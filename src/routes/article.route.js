import { Router } from "express";
import { createArticle,allPublishedArticle } from "../controllers/article.controller.js";

const router = Router()

router.post("/create", createArticle )
router.post("/", allPublishedArticle)

export default router