import mongoose, { Schema, Document } from "mongoose";

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  text: string; // Changed from content
  userId: mongoose.Types.ObjectId; // Changed from sender
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    text: {
      // Changed from content
      type: String,
      required: true,
    },
    userId: {
      // Changed from sender
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const PostModel = mongoose.model<IPost>("Post", postSchema);
export default PostModel;
