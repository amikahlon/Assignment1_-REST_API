import { Request, Response } from "express";
import commentsModel from "../models/Comment_model";

class CommentController {
  model: any;

  constructor() {
    this.model = commentsModel;
  }

  async createItem(req: Request, res: Response): Promise<void> {
    try {
      const commenterId = req.query.userId;
      const { content, postId } = req.body;

      if (!commenterId) {
        res.status(401).json({
          status: "error",
          message: "User ID not found in token",
        });
        return;
      }

      if (!content || !postId) {
        res.status(400).json({
          status: "error",
          message: "Content and postId are required",
        });
        return;
      }

      const comment = {
        content,
        postId,
        commenter: commenterId,
      };

      const data = await this.model.create(comment);
      const populatedData = await data.populate("commenter", "username email");

      res.status(201).json({
        status: "success",
        data: populatedData,
      });
    } catch (err) {
      res.status(400).json({
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.query;
      if (!postId) {
        res.status(400).json({
          status: "error",
          message: "Post ID is required",
        });
        return;
      }

      const comments = await this.model
        .find({ postId })
        .sort({ createdAt: -1 })
        .populate("commenter", "username email");

      res.status(200).json({
        status: "success",
        count: comments.length,
        data: comments,
      });
    } catch (err) {
      res.status(400).json({
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  async updateItem(req: Request, res: Response): Promise<void> {
    try {
      const commenterId = req.query.userId;
      const comment = await this.model.findById(req.params.id);

      if (!comment) {
        res.status(404).json({
          status: "error",
          message: "Comment not found",
        });
        return;
      }

      if (comment.commenter.toString() !== commenterId) {
        res.status(403).json({
          status: "error",
          message: "Not authorized to update this comment",
        });
        return;
      }

      comment.content = req.body.content;
      await comment.save();

      const updatedComment = await comment.populate(
        "commenter",
        "username email"
      );
      res.json({
        status: "success",
        data: updatedComment,
      });
    } catch (err) {
      res.status(400).json({
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  async deleteItem(req: Request, res: Response): Promise<void> {
    try {
      const comment = await this.model.findByIdAndDelete(req.params.id);
      if (!comment) {
        res.status(404).json({
          status: "error",
          message: "Comment not found",
        });
        return;
      }
      res.status(200).json({
        status: "success",
        message: "Comment deleted",
      });
    } catch (err) {
      res.status(400).json({
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }
}

export default new CommentController();
