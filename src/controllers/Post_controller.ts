import { Request, Response } from "express";
import Post from "../models/post_model";

export const addPost = async (req: Request, res: Response): Promise<void> => {
    try {
      const post = new Post(req.body);
      const savedPost = await post.save();
      res.status(201).json(savedPost);
    } catch (error: unknown) {
      res.status(400).json({ error: (error as Error).message });
    }
  };
  
  export const getPosts = async (req: Request, res: Response): Promise<void> => {
    try {
      const posts = req.query.sender
        ? await Post.find({ sender: req.query.sender })
        : await Post.find();
  
      if (!posts.length) {
        res.status(404).json({ message: "No posts found" });
        return;
      }
  
      res.json(posts);
    } catch (error: unknown) {
      res.status(500).json({ error: (error as Error).message });
    }
  };
  
  export const getPostById = async (req: Request, res: Response): Promise<void> => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) {
        res.status(404).json({ message: "Post not found" });
        return;
      }
      res.json(post);
    } catch (error: unknown) {
      res.status(500).json({ error: (error as Error).message });
    }
  };
  
  export const updatePost = async (req: Request, res: Response): Promise<void> => {
    try {
      const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updatedPost) {
        res.status(404).json({ message: "Post not found" });
        return;
      }
      res.json(updatedPost);
    } catch (error: unknown) {
      res.status(400).json({ error: (error as Error).message });
    }
  };
  
  export const deletePost = async (req: Request, res: Response): Promise<void> => {
    try {
      const deletedPost = await Post.findByIdAndDelete(req.params.id);
      if (!deletedPost) {
        res.status(404).json({ message: "Post not found" });
        return;
      }
      res.json(deletedPost);
    } catch (error: unknown) {
      res.status(500).json({ error: (error as Error).message });
    }
  };