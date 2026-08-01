import User from "../models/user.model.js"

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    return res.status(200).json({ message: "Profile fetched successfully", user })
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const { name, lastname, email, username, avatar } = req.body
    const updateData = {}

    if (name !== undefined) updateData.name = name
    if (lastname !== undefined) updateData.lastname = lastname
    if (email !== undefined) updateData.email = email
    if (username !== undefined) updateData.username = username
    if (avatar !== undefined) updateData.avatar = avatar

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No profile data provided to update" })
    }

    const existingUser = await User.findOne({
      $or: [{ username: updateData.username }, { email: updateData.email }],
      _id: { $ne: req.user._id },
    })

    if (existingUser) {
      return res.status(409).json({ message: "Username or email is already in use" })
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
    }).select("-password")

    return res.status(200).json({ message: "Profile updated successfully", user: updatedUser })
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message })
  }
}
