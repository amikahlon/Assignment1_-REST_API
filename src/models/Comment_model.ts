import mongoose, { Schema, Document, Model } from "mongoose";

// Interface שמגדיר את מבנה התגובה
export interface IComment extends Document {
  postId: mongoose.Types.ObjectId; // ObjectId שמפנה לפוסט
  content: string;
  commenter: string;
}

// הגדרת הסכמה
const commentSchema: Schema<IComment> = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  content: { type: String, required: true },
  commenter: { type: String, required: true },
});

// יצירת מודל
const Comment: Model<IComment> = mongoose.model<IComment>(
  "Comment",
  commentSchema
);

export default Comment;
