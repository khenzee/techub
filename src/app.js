import express from "express"

const app = express()

app.get("/", (req, res) =>{
    res.send("<h1>hello world</h1>")
})
app.get("/about", (req, res)=>{
    res.send("<h1>this s about</h1>")
})

export default app