import { Request, Response } from "express";
import Comment from "../models/Comment_model";
import Post from "../models/post_model";

// Add a New Comment
export const addComment = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if the post exists
    const postExists = await Post.findById(req.body.postId);
    if (!postExists) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    // Create and save the comment
    const comment = new Comment(req.body);
    const savedComment = await comment.save();

    res.status(201).json(savedComment);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
};

// Get All Comments for a Post
export const getCommentsByPostId = async (req: Request, res: Response): Promise<void> => {
  try {
    const comments = await Comment.find({ postId: req.params.postId });
    if (!comments.length) {
      res.status(404).json({ message: "No comments found for this post" });
      return;
    }
    res.json(comments);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Update a Comment
export const updateComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const updatedComment = await Comment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedComment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }
    res.json(updatedComment);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
};

// Delete a Comment
export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedComment = await Comment.findByIdAndDelete(req.params.id);
    if (!deletedComment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }
    res.json(deletedComment);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
};