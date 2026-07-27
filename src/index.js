import app from "./app.js"
import connectDB from "./config/database.js"
import dotenv from "dotenv"

const PORT = 5001

dotenv.config({
    path: "./.env"
})

const server = async () =>{
    try {
        await connectDB()
        app.listen(PORT, ()=>{
            console.log(`app running at http://localhost:${PORT}`)
        })
    } catch (error) {
        console.log("server connection fail")
    }
}

server()