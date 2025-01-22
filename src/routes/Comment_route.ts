import express from "express";
import { Request, Response, NextFunction } from "express";
import CommentController from "../controllers/Comment_controller";
import { authMiddleware } from "../controllers/auth_controller";

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *         - content
 *         - commenter
 *         - postId
 *       properties:
 *         content:
 *           type: string
 *           description: The content of the comment
 *         commenter:
 *           type: string
 *           description: The commenter's ID
 *         postId:
 *           type: string
 *           description: The ID of the post this comment belongs to
 *       example:
 *         content: This is a comment
 *         commenter: 6457891234567890
 *         postId: 7890123456789012
 *     CommentInput:
 *       type: object
 *       required:
 *         - content
 *         - postId
 *       properties:
 *         content:
 *           type: string
 *           description: The content of the comment
 *         postId:
 *           type: string
 *           description: The ID of the post this comment belongs to
 *       example:
 *         content: This is a comment
 *         postId: 507f1f77bcf86cd799439011
 */

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Comment management API
 */

const router = express.Router();

/**
 * @swagger
 * /comments:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     summary: Create a new comment
 *     description: Creates a new comment. The commenter ID is automatically added from the access token.
 *     tags: [Comments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentInput'
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Missing or invalid token
 */
router.post(
  "/",
  (req: Request, res: Response, next: NextFunction) =>
    authMiddleware(req, res, next),
  (req: Request, res: Response) => CommentController.createItem(req, res)
);

/**
 * @swagger
 * /comments/{postId}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get all comments for a post
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 */
router.get(
  "/:postId",
  (req: Request, res: Response, next: NextFunction) =>
    authMiddleware(req, res, next),
  async (req: Request, res: Response) => {
    req.query.postId = req.params.postId;
    await CommentController.getAll(req, res);
  }
);

/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     security:
 *       - bearerAuth: []
 *     summary: Update a comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       404:
 *         description: Comment not found
 */
router.put(
  "/:id",
  (req: Request, res: Response, next: NextFunction) =>
    authMiddleware(req, res, next),
  (req: Request, res: Response) => CommentController.updateItem(req, res)
);

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     summary: Delete a comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       404:
 *         description: Comment not found
 */
router.delete(
  "/:id",
  (req: Request, res: Response, next: NextFunction) =>
    authMiddleware(req, res, next),
  (req: Request, res: Response) => CommentController.deleteItem(req, res)
);

export default router;
