import request from "supertest";
import mongoose, { Types } from "mongoose";
import app from "../app";
import CommentModel from "../models/Comment_model";
import PostModel from "../models/post_model";
import UserModel from "../models/user_model";

let accessToken: string;
let userId: string;
let postId: Types.ObjectId;

const testUser = {
  username: "testuser",
  email: "test@test.com",
  password: "password123",
};

const testPost = {
  text: "This is a test post",
  title: "Test Post",
};

const testComment = {
  content: "This is a test comment",
};

beforeAll(async () => {
  await mongoose.connect(
    process.env.TEST_DB_URL || "mongodb://localhost:27017/test_db"
  );

  // Create test user and get token
  const registerRes = await request(app).post("/auth/register").send(testUser);

  // Get the token from the correct location in response
  accessToken = registerRes.body.data.accessToken;
  userId = registerRes.body.data.userId;

  // Create test post
  const postRes = await PostModel.create({
    ...testPost,
    userId: new Types.ObjectId(userId),
  });
  postId = postRes._id;
});

afterAll(async () => {
  await CommentModel.deleteMany({});
  await PostModel.deleteMany({});
  await UserModel.deleteMany({});
  await mongoose.connection.close();
});

beforeEach(async () => {
  await CommentModel.deleteMany({});
});

describe("Comments API", () => {
  describe("POST /comments", () => {
    it("should create a new comment with valid token", async () => {
      const res = await request(app)
        .post("/comments")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ ...testComment, postId: postId.toString() });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty("_id");
      expect(res.body.data.content).toBe(testComment.content);
      expect(res.body.data.postId).toBe(postId.toString());
      expect(res.body.data.commenter).toBe(userId);
    });

    it("should fail to create comment without token", async () => {
      const res = await request(app)
        .post("/comments")
        .send({ ...testComment, postId: postId.toString() });

      expect(res.status).toBe(401);
    });

    it("should fail to create comment with invalid token", async () => {
      const res = await request(app)
        .post("/comments")
        .set("Authorization", "Bearer invalid_token")
        .send({ ...testComment, postId: postId.toString() });

      expect(res.status).toBe(403);
    });

    it("should fail to create comment without required fields", async () => {
      const res = await request(app)
        .post("/comments")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe("GET /comments/:postId", () => {
    beforeEach(async () => {
      // Create some test comments
      await CommentModel.create({
        ...testComment,
        postId: postId,
        commenter: userId,
      });
      await CommentModel.create({
        ...testComment,
        postId: postId,
        commenter: userId,
      });
    });

    it("should get all comments for a post", async () => {
      const res = await request(app)
        .get(`/comments/${postId.toString()}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBeTruthy();
      expect(res.body.data.length).toBe(2);
      expect(res.body.count).toBe(2);
    });
  });

  describe("PUT /comments/:id", () => {
    let commentId: Types.ObjectId;

    beforeEach(async () => {
      const comment = (await CommentModel.create({
        ...testComment,
        postId: postId,
        commenter: userId,
      })) as mongoose.Document & { _id: Types.ObjectId };
      commentId = comment._id;
    });

    it("should update comment successfully", async () => {
      const updatedData = { content: "Updated comment content" };

      const res = await request(app)
        .put(`/comments/${commentId.toString()}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updatedData);

      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe(updatedData.content);
    });

    it("should fail to update non-existent comment", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .put(`/comments/${fakeId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ content: "Updated comment content" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /comments/:id", () => {
    let commentId: Types.ObjectId;

    beforeEach(async () => {
      const comment = (await CommentModel.create({
        ...testComment,
        postId: postId,
        commenter: userId,
      })) as mongoose.Document & { _id: Types.ObjectId };
      commentId = comment._id;
    });

    it("should delete comment successfully", async () => {
      const res = await request(app)
        .delete(`/comments/${commentId.toString()}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      // Verify comment is deleted
      const deletedComment = await CommentModel.findById(commentId);
      expect(deletedComment).toBeNull();
    });

    it("should fail to delete non-existent comment", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .delete(`/comments/${fakeId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /comments", () => {
    beforeEach(async () => {
      await CommentModel.deleteMany({});
      await CommentModel.create([
        {
          ...testComment,
          postId,
          commenter: new Types.ObjectId(userId),
          content: "Comment 1",
          createdAt: new Date(Date.now() - 1000),
        },
        {
          ...testComment,
          postId,
          commenter: new Types.ObjectId(userId),
          content: "Comment 2",
          createdAt: new Date(),
        },
      ]);
    });

    it("should fail to get comments without postId", async () => {
      const res = await request(app)
        .get("/comments")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("error");
    });

    it("should return comments sorted by creation date (newest first)", async () => {
      const res = await request(app)
        .get("/comments")
        .query({ postId: postId.toString() })
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBeTruthy();
      const comments = res.body.data;
      for (let i = 0; i < comments.length - 1; i++) {
        const currentDate = new Date(comments[i].createdAt).getTime();
        const nextDate = new Date(comments[i + 1].createdAt).getTime();
        expect(currentDate).toBeGreaterThanOrEqual(nextDate);
      }
    });

    it("should return populated commenter data", async () => {
      const res = await request(app)
        .get("/comments")
        .query({ postId: postId.toString() })
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].commenter).toHaveProperty("username");
      expect(res.body.data[0].commenter).toHaveProperty("email");
    });
  });

  describe("POST /comments validation", () => {
    it("should fail with empty content", async () => {
      const res = await request(app)
        .post("/comments")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ postId: postId.toString(), content: "" });

      expect(res.status).toBe(400);
    });

    it("should fail with invalid postId", async () => {
      const res = await request(app)
        .post("/comments")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ postId: "invalid-id", content: "Valid content" });

      expect(res.status).toBe(400);
    });
  });

  describe("PUT /comments/:id", () => {
    let otherUserComment: any;

    beforeEach(async () => {
      otherUserComment = await CommentModel.create({
        content: "Other user's comment",
        postId,
        commenter: new Types.ObjectId(),
      });
    });

    it("should fail to update another user's comment", async () => {
      const res = await request(app)
        .put(`/comments/${otherUserComment._id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ content: "Attempted update" });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe("error");
      expect(res.body.message).toBe("Not authorized to update this comment");
    });

    it("should fail with empty content", async () => {
      const comment = await CommentModel.create({
        content: "Original content",
        postId,
        commenter: userId,
      });

      const res = await request(app)
        .put(`/comments/${comment._id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ content: "" });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /comments/:id", () => {
    it("should fail with invalid comment id format", async () => {
      const res = await request(app)
        .delete("/comments/invalid-id")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
    });

    it("should return success message after deletion", async () => {
      const comment = await CommentModel.create({
        content: "To be deleted",
        postId,
        commenter: userId,
      });

      const res = await request(app)
        .delete(`/comments/${comment._id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.message).toBe("Comment deleted");
    });
  });
});
