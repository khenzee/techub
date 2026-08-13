import express from "express"
import authRouter from "./routes/auth.route.js"
import articleRouter from "./routes/article.route.js"
import categoryRouter from "./routes/category.route.js"
import userRouter from "./routes/user.route.js"
import commentRouter from "./routes/comment.route.js"
import likeRouter from "./routes/like.route.js"
import swaggerUi from "swagger-ui-express"
import fs from "fs"
import { fileURLToPath } from "url"
import path from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(express.json())

// Serve Swagger UI at /api-docs
try {
	const swaggerPath = path.join(__dirname, "..", "swagger.json")
	const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, "utf8"))
	app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))
} catch (err) {
	console.warn("Could not load swagger.json:", err.message)
}

app.use("/api/v1/auth", authRouter)
app.use("/api/v1/article", articleRouter)
app.use("/category", categoryRouter)
app.use("/user", userRouter)
app.use("/comment", commentRouter)
app.use("/like", likeRouter)

export default app
