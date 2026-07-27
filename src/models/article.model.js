import mongoose from "mongoose";

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
  
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Article = mongoose.model("Article", articleSchema);

export default Article;
