import express from "express"
import authRouter from "./routes/auth.route.js"
import articleRouter from "./routes/article.route.js"
const app = express()

app.use(express.json())

app.use("/auth", authRouter)
app.use("/article", articleRouter)
export default app