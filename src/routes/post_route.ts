import express from "express";
import { Request, Response, NextFunction } from "express";
import PostController from "../controllers/Post_controller";
import { authMiddleware } from "../controllers/auth_controller";

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       required:
 *         - title
 *         - content
 *       properties:
 *         title:
 *           type: string
 *           description: The title of the post
 *         content:
 *           type: string
 *           description: The content of the post
 *       example:
 *         title: My First Post
 *         content: This is the content of my post
 */

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Post management API
 */

const router = express.Router();

/**
 * @swagger
 * /posts:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     summary: Create a new post
 *     description: Creates a new post. The sender ID is automatically added from the access token.
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Missing or invalid token
 */
router.post(
  "/",
  (req: Request, res: Response, next: NextFunction) =>
    authMiddleware(req, res, next),
  (req: Request, res: Response) => PostController.createItem(req, res)
);

/**
 * @swagger
 * /posts:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get all posts
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: List of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */
router.get(
  "/",
  (req: Request, res: Response, next: NextFunction) =>
    authMiddleware(req, res, next),
  (req: Request, res: Response) => PostController.getAll(req, res)
);

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get a post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post details
 *       404:
 *         description: Post not found
 */
router.get(
  "/:id",
  (req: Request, res: Response, next: NextFunction) =>
    authMiddleware(req, res, next),
  (req: Request, res: Response) => PostController.getById(req, res)
);

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     security:
 *       - bearerAuth: []
 *     summary: Update a post
 *     tags: [Posts]
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
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       404:
 *         description: Post not found
 */
router.put(
  "/:id",
  (req: Request, res: Response, next: NextFunction) =>
    authMiddleware(req, res, next),
  (req: Request, res: Response) => PostController.updateItem(req, res)
);

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     summary: Delete a post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       404:
 *         description: Post not found
 */
router.delete(
  "/:id",
  (req: Request, res: Response, next: NextFunction) =>
    authMiddleware(req, res, next),
  (req: Request, res: Response) => PostController.deleteItem(req, res)
);

/**
 * @swagger
 * /posts/user/{userId}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get all posts by user ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user whose posts to retrieve
 *     responses:
 *       200:
 *         description: List of posts by user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 count:
 *                   type: number
 *                   description: Number of posts found
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *       400:
 *         description: Invalid user ID or other error
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/user/:userId",
  (req: Request, res: Response, next: NextFunction) =>
    authMiddleware(req, res, next),
  (req: Request, res: Response) => PostController.getPostsByUserId(req, res)
);

export default router;
