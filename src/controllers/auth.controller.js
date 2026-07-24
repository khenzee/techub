import User from "../models/user.model.js"

const Register = async (req, res) =>{
    try {
        const {name, lastname, password, email, username} = req.body

        if(!name || !lastname || !password || !username){
            res.status(400).json(
                {
                    message: "name, lastname, password and username is required"
                }
            )
        }
        const existingUser = await User.findOne({username})
        if(existingUser){
            res.status(401).json(
                {
                    message:"user already exists"
                }
            )
        }
        const user = User.create({
            name,
            lastname,
            email,
            password,
            username
        })

        res.status(201).json({
            message: "user successfully created",
            user: req.body
        })

    } catch (error) {
        res.status(500).json(
            {
                message: " internal derver error",
                error: error.message
            }
        )
    }
}