import mongoose from "mongoose"
import Comment from "../models/comment.model.js"
import Article from "../models/article.model.js"

export const addComment = async (req, res) => {
  try {
    const { articleId, comment } = req.body

    if (!articleId || !comment) {
      return res.status(400).json({ message: "articleId and comment are required" })
    }

    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      return res.status(400).json({ message: "Invalid article ID" })
    }

    const article = await Article.findById(articleId)
    if (!article) {
      return res.status(404).json({ message: "Article not found" })
    }

    const newComment = await Comment.create({
      comment,
      user: req.user._id,
      article: articleId,
    })

    return res.status(201).json({ message: "Comment added successfully", comment: newComment })
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message })
  }
}

export const getCommentsByArticle = async (req, res) => {
  try {
    const { articleId } = req.params

    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      return res.status(400).json({ message: "Invalid article ID" })
    }

    const comments = await Comment.find({ article: articleId })
      .populate("user", "name lastname username avatar")
      .sort({ createdAt: -1 })

    if (comments.length === 0) {
      return res.status(404).json({ message: "No comments found for this article" })
    }

    return res.status(200).json({ message: "Comments fetched successfully", comments })
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message })
  }
}

export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid comment ID" })
    }

    const comment = await Comment.findById(id)
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" })
    }

    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: you cannot delete this comment" })
    }

    await Comment.findByIdAndDelete(id)
    return res.status(200).json({ message: "Comment deleted successfully" })
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message })
  }
}
