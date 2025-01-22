import postsModel from "../models/post_model";
import { Request, Response } from "express";

class PostController {
  model: any;

  constructor() {
    this.model = postsModel;
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.userId
        ? { userId: req.query.userId.toString() }
        : {};
      const posts = await this.model.find(query).sort({ createdAt: -1 });

      res.status(200).json({
        status: "success",
        count: posts.length,
        data: posts,
      });
    } catch (err) {
      res.status(400).json({
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).send("invalid id");
        return;
      }
      const data = await this.model.findById(id);
      if (!data) {
        res.status(404).send("item not found");
        return;
      }
      res.send(data);
    } catch (err) {
      res.status(400).send(err);
    }
  }

  async createItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.userId;
      if (!userId) {
        res.status(401).json({
          status: "error",
          message: "User ID not found in token",
        });
        return;
      }

      const { title, text } = req.body;

      if (!title || !text) {
        res.status(400).json({
          status: "error",
          message: "Missing required fields",
        });
        return;
      }

      if (typeof title !== "string" || typeof text !== "string") {
        res.status(400).json({
          status: "error",
          message: "Invalid data types",
        });
        return;
      }

      const post = {
        title,
        text,
        userId: userId,
      };

      const data = await this.model.create(post);
      res.status(201).json(data);
    } catch (err) {
      console.error("Create post error:", err);
      res.status(400).json({
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  async updateItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.userId;
      const post = await this.model.findById(req.params.id);

      if (!post) {
        res.status(404).send("Post not found");
        return;
      }

      if (post.userId.toString() !== userId) {
        res.status(403).send("Not authorized to update this post");
        return;
      }

      const { title, text } = req.body;
      if (
        (title && typeof title !== "string") ||
        (text && typeof text !== "string")
      ) {
        res.status(400).json({
          status: "error",
          message: "Invalid input data",
        });
        return;
      }

      const updatedPost = await this.model.findByIdAndUpdate(
        req.params.id,
        { title, text },
        { new: true }
      );
      res.status(200).json(updatedPost);
    } catch (err) {
      res.status(400).send(err);
    }
  }

  async deleteItem(req: Request, res: Response): Promise<void> {
    try {
      const post = await this.model.findByIdAndDelete(req.params.id);
      if (!post) {
        res.status(404).send("Post not found");
        return;
      }
      res.status(200).send("Post deleted");
    } catch (err) {
      res.status(400).send(err);
    }
  }

  async getPostsByUserId(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const posts = await this.model
        .find({ userId: userId })
        .sort({ createdAt: -1 })
        .populate("userId", "username email");

      res.status(200).json({
        status: "success",
        count: posts.length,
        data: posts,
      });
    } catch (err) {
      res.status(400).json({
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }
}

export default new PostController();
