import Category from "../models/category.model.js"
import slugify from "slugify"

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({ message: "Category name is required" })
    }

    const slug = slugify(name, { lower: true, strict: true })
    const existingCategory = await Category.findOne({$or:[{name},{slug}]})
    if (existingCategory) {
      return res.status(409).json({ message: "Category already exists" })
    }

    const category = await Category.create({
      name,
      slug: slug,
      description: description || "",
    })

    return res.status(201).json({ message: "Category created successfully", category })
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message })
  }
}

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find()
    if (categories.length === 0) {
      return res.status(404).json({ message: "No categories found" })
    }
    return res.status(200).json({ message: "Categories fetched successfully", categories })
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message })
  }
}

export const getCategory = async (req, res) => {
  try {
    const { id } = req.params
    const category = await Category.findById(id)
    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }
    return res.status(200).json({ message: "Category fetched successfully", category })
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message })
  }
}

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { name, description } = req.body

    const category = await Category.findById(id)
    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }

    const updateData = {}
    if (name) {
      updateData.name = name
      updateData.slug = slugify(name, { lower: true, strict: true })
    }
    if (description !== undefined) {
      updateData.description = description
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, { new: true })
    return res.status(200).json({ message: "Category updated successfully", category: updatedCategory })
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message })
  }
}

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params
    const category = await Category.findById(id)
    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }

    await Category.findByIdAndDelete(id)
    return res.status(200).json({ message: "Category deleted successfully" })
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message })
  }
}
