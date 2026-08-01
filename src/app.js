import express from "express"
import authRouter from "./routes/auth.route.js"
import articleRouter from "./routes/article.route.js"
import categoryRouter from "./routes/category.route.js"
import userRouter from "./routes/user.route.js"
import commentRouter from "./routes/comment.route.js"
import likeRouter from "./routes/like.route.js"
const app = express()

app.use(express.json())

app.use("/auth", authRouter)
app.use("/article", articleRouter)
app.use("/category", categoryRouter)
app.use("/user", userRouter)
app.use("/comment", commentRouter)
app.use("/like", likeRouter)
export default app
