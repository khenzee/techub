import User from "../models/user.model.js"
import { generateToken } from "../utils/generateToken.js"
import { hashPassword } from "../utils/hashPass.js"
import bcrypt from "bcrypt"


export const Register = async (req, res) =>{
    try {
        const {name, lastname, password, email, username, role} = req.body

        if(!name || !lastname || !password || !username){
            return res.status(400).json(
                {
                    message: "name, lastname, password and username is required"
                }
            )
        }
        const existingUser = await User.findOne({username})
        if(existingUser){
            return res.status(401).json(
                {
                    message:"user already exists"
                }
            )
        }

        const hashedPassword = await hashPassword(password)
        const user = await User.create({
            name,
            lastname,
            email,
            password: hashedPassword,
            username,
            role: role
        })

        return res.status(201).json({
            message: "user successfully created",
            user
        })

    } catch (error) {
        return res.status(500).json(
            {
                message: " internal server error",
                error: error.message
            }
        )
    }
}


export const Login = async (req,res) =>{
    try {
        const {username, password} = req.body

        if(!username || !password){
            return res.status(400).json({
                message: "all field is required"         
            })
        }
        const existUser = await User.findOne({username})
        if(!existUser){
            res.status(404).json({
                message: "user not found"
            })
        }
        const isCorrectPassword = await bcrypt.compare(password, existUser.password)
        if(!isCorrectPassword){
            return res.status(401).json({message: "incorrect password"})
        }
        const token = await generateToken(existUser._id)
        return res.status(200).json({
            message: "user login successful",
            token,
            user: username

        })

    } catch (error) {
        return res.status(500).json(
            {
                message: " internal server error",
                error: error.message
            }
        )
    }
}