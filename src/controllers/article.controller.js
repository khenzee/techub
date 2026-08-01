import Article from "../models/article.model.js"
import slugify from "slugify"

export const createArticle = async (req, res) => {
    try {
        const { title, content, status } = req.body

        if (!title || !content) {
            return res.status(400).json({
                message: "all field required"
            })
        }
        const slug = slugify(title)
        const article = await Article.create({
            title,
            content,
            slug: slug,
            author: req.user._id
        })

        return res.status(201).json({
            message: "created successfully",
            article
        })

    } catch (error) {
        return res.status(500).json({
            message: "internal server error",
            error: error.message
        })
    }
}

export const getArticle = async(req,res)=>{
    try {
        const article = await Article.find()
        if(article.length === 0){
            return res.status(404).json({
                message:"no article found"
            })
        }
        return res.status(200).json({
            message:"article fetched successfully",
            article
        })
    } catch (error) {
        return res.status(500).json({
            message:"internal server error",
            error:error.message
        })
    }
}

export const allPublishedArticle = async(req,res)=>{
    try {
        const article = await Article.find({status:"published"})
        if(article.length === 0){
            return res.status(404).json({
                message:"no article found"
            })
        }
        return res.status(200).json({
            message:"article fetched successfully",
            article
        })
    } catch (error) {
       return res.status(500).json({
            message:"internal server error",
            error:error.message
        })
    }
}

export const updateArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, status } = req.body;
        
        let article = await Article.findById(id);
        if (!article) {
            return res.status(404).json({ message: "Article not found" });
        }

        let updateData = { title, content, status };

        article = await Article.findByIdAndUpdate(id, updateData, { new: true });
       return res.status(200).json({ message: "Article updated successfully", article });
    } catch (error) {
       return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const deleteArticle = async (req, res) => {
    try {
        const { id } = req.params;
        
        const article = await Article.findById(id);
        if (!article) {
            return res.status(404).json({ message: "Article not found" });
        }
        
        await Article.findByIdAndDelete(id);
       
       return res.status(200).json({ message: "Article deleted successfully" });
    } catch (error) {
       return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const singleArticle = async(req,res) =>{
    try {
        const {id} = req.params

        const article = await Article.findById(id)
        if(!article){
            return res.status(404).json({
                message: "article not found"
            }) 
        }
        return res.status(200).json({
            message: "article found",
            article
        })
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}
