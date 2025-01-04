import mongoose, { Schema, Document } from "mongoose";

export interface IComment extends Document {
  postId: mongoose.Types.ObjectId; // Reference to the Post
  content: string; // The content of the comment
  commenter: mongoose.Types.ObjectId; // Reference to the User
}

const commentSchema: Schema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Comment content is required"],
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
    commenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt fields automatically
);

const Comment = mongoose.model<IComment>("Comment", commentSchema);
export default Comment;