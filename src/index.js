import app from "./app.js"
import connectDB from "./config/database.js"
import dotenv from "dotenv"

const PORT = process.env.PORT || 5000

dotenv.config({
    path: "./.env"
})

const startServer = () => {
    app.listen(PORT, ()=>{
        console.log(`app running at http://localhost:${PORT}`)
    })
}

const server = async () =>{
    try {
        await connectDB()
    } catch (error) {
        console.warn("Database connection failed:", error && error.message ? error.message : error)
        // continue and start server so docs and non-db endpoints are reachable
    } finally {
        startServer()
    }
}

server()