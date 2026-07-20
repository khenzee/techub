import app from "./app.js"

const PORT = 5000

app.listen(PORT, ()=>{
    console.log(`app running at http://localhost:${PORT}`)
})