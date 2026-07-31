import jwt from "jsonwebtoken"
import User from "../models/user.model.js"


export const protect = async (req, res, next) =>{
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Not authorized' });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user to request
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
        return res.status(401).json({ error: 'User not found' });
        }

        next();

    } catch (error) {
         res.status(401).json({ error: 'Not authorized' });
    }
}


export const isRole = (role) =>{
    return async (req, res, next) =>{
        if(!role.includes(req.user.role)) {
            res.status(403).json({message:"Forbidden: Unauthorized role"})
        }
        next()
    }
}