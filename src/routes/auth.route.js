import { Router } from "express";
import { Register } from "../controllers/auth.controller.js";

const router = Router()

router.post("/register", Register )

export default router