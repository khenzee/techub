import mongoose  from "mongoose";

const connectDB = async () =>{
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI)
        console.log(`\n MongoDB Connected ...`)
    } catch (error) {
        console.warn('MongoDB connection error:', error && error.message ? error.message : error)
        // Do not exit the process here; allow the server to start so docs/status endpoints remain available.
        return null
    }
}

export default connectDB