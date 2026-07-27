import Article from "../models/article.model.js"


export const createArticle = async (req, res) => {
    try {
        const { title, content, status } = req.body

        if (!title || !content) {
            return res.status(400).json({
                message: "all field required"
            })
        }

        const article = await Article.create({
            title,
            content
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


export const allPublishedArticle = async(req,res)=>{
    try {
        const article = await Article.find({status:"published"})
        if(!article){
            res.status(200).json({
                message:"no article found",
                error: error.message
            })
        }
        return res.status(200).json({
            message:"article fetched successfully",
            article
        })
    } catch (error) {
        res.status(500).json({
            message:"internal server error",
            error:error.message
        })
    }
}

export const updateArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category, status } = req.body;
        
        let article = await Article.findById(id);
        if (!article) {
            return res.status(404).json({ message: "Article not found" });
        }
     
        
        let updateData = { title, content, category, status };
    
        
        article = await Article.findByIdAndUpdate(id, updateData, { new: true });
        res.status(200).json({ message: "Article updated successfully", article });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
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
       
        res.status(200).json({ message: "Article deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
