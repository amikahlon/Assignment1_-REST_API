import { Request, Response } from "express";
import mongoose, { Schema, Document } from "mongoose";

// Post Model
export interface IPost extends Document {
  title: string;
  content: string;
  sender: string;
}

const postSchema: Schema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  sender: { type: String, required: true },
}, { timestamps: true });

const Post = mongoose.model<IPost>("Post", postSchema);
export default Post;