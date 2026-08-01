import mongoose from "mongoose"
import Like from "../models/like.model.js"
import Article from "../models/article.model.js"

export const likeArticle = async (req, res) => {
  try {
    const { articleId } = req.params

    const article = await Article.findById(articleId)
    if (!article) {
      return res.status(404).json({ message: "Article not found" })
    }

    const existingLike = await Like.findOne({ article: articleId, user: req.user._id })
    if (existingLike) {
      return res.status(409).json({ message: "Article already liked" })
    }

    const like = await Like.create({ article: articleId, user: req.user._id })
    return res.status(201).json({ message: "Article liked successfully", like })
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message })
  }
}

export const unlikeArticle = async (req, res) => {
  try {
    const { articleId } = req.params

    const deletedLike = await Like.findOneAndDelete({ article: articleId, user: req.user._id })
    if (!deletedLike) {
      return res.status(404).json({ message: "Like not found" })
    }

    return res.status(200).json({ message: "Article unliked successfully" })
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message })
  }
}

export const getArticleLikes = async (req, res) => {
  try {
    const { articleId } = req.params

    const count = await Like.countDocuments({ article: articleId })
    return res.status(200).json({ message: "Likes fetched successfully", likes: count })
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message })
  }
}

export const getMyLikes = async (req, res) => {
  try {
    const likes = await Like.find({ user: req.user._id }).populate("article", "title slug")
    if (likes.length === 0) {
      return res.status(404).json({ message: "No liked articles found" })
    }
    return res.status(200).json({ message: "Liked articles fetched successfully", likes })
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message })
  }
}
