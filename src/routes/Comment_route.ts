import express from "express";
import {
  addComment,
  getCommentsByPostId,
  updateComment,
  deleteComment,
} from "../controllers/Comment_controller";
import { authMiddleware } from "../middlewares/auth_middleware"; // Middleware for authentication

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *         - postId
 *         - content
 *         - commenter
 *       properties:
 *         postId:
 *           type: string
 *           description: ID of the related post
 *         content:
 *           type: string
 *           description: Content of the comment
 *         commenter:
 *           type: string
 *           description: ID of the user who posted the comment
 *       example:
 *         postId: 61d3c86f4b1e4a001c9f69e2
 *         content: This is a comment
 *         commenter: 61d3c86f4b1e4a001c9f69e3
 */

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: API for managing comments
 */

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Add a new comment
 *     tags: [Comments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Post not found
 *       401:
 *         description: Unauthorized
 */
router.post("/", authMiddleware, addComment);

/**
 * @swagger
 * /comments/{postId}:
 *   get:
 *     summary: Get all comments for a post
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the post
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       404:
 *         description: No comments found
 */
router.get("/:postId", getCommentsByPostId);

/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the comment to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Comment not found
 */
router.put("/:id", authMiddleware, updateComment);

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the comment to delete
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       404:
 *         description: Comment not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", authMiddleware, deleteComment);

export default router;