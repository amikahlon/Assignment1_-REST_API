import request from "supertest";
import mongoose, { Types } from "mongoose"; // Add Types import
import app from "../app";
import PostModel, { IPost } from "../models/post_model";
import UserModel from "../models/user_model";

let accessToken: string;
let userId: string;

const testUser = {
  username: "testuser",
  email: "test@test.com",
  password: "password123",
};

const testPost = {
  text: "This is a test post",
  title: "Test Post",
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
});

afterAll(async () => {
  await PostModel.deleteMany({});
  await UserModel.deleteMany({});
  await mongoose.connection.close();
});

beforeEach(async () => {
  await PostModel.deleteMany({});
});

describe("Posts API", () => {
  describe("POST /posts", () => {
    it("should create a new post with valid token", async () => {
      const res = await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(testPost);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body.text).toBe(testPost.text);
      expect(res.body.title).toBe(testPost.title);
      expect(res.body.userId).toBe(userId);
    });

    it("should fail to create post without token", async () => {
      const res = await request(app).post("/posts").send(testPost);

      expect(res.status).toBe(401);
    });

    it("should fail to create post with invalid token", async () => {
      const res = await request(app)
        .post("/posts")
        .set("Authorization", "Bearer invalid_token")
        .send(testPost);

      expect(res.status).toBe(403);
    });

    it("should fail to create post without required fields", async () => {
      const res = await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it("should fail to create post with invalid data types", async () => {
      const res = await request(app)
        .post("/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ title: "Title", text: 123 });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /posts", () => {
    beforeEach(async () => {
      await PostModel.deleteMany({}); // Ensure clean state
      // Create test posts
      await PostModel.create({
        ...testPost,
        userId: userId,
        title: "Post 1",
      });
      await PostModel.create({
        ...testPost,
        userId: userId,
        title: "Post 2",
      });
    });

    it("should get all posts", async () => {
      const res = await request(app)
        .get("/posts")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBeTruthy();
      expect(res.body.data.length).toBe(2);
      expect(res.body.count).toBe(2);
    });

    it("should filter posts by userId", async () => {
      const res = await request(app)
        .get(`/posts?userId=${userId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBeTruthy();
      expect(
        res.body.data.every((post: any) => post.userId === userId)
      ).toBeTruthy();
    });

    it("should return empty array if no posts match filter", async () => {
      await PostModel.deleteMany({}); // Ensure no posts in DB
      const fakeUserId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get("/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .query({ userId: fakeUserId });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBeTruthy();
      expect(res.body.data.length).toBe(0);
    });
  });

  describe("GET /posts/:id", () => {
    let postId: Types.ObjectId; // Use Types.ObjectId instead of mongoose.Types.ObjectId

    beforeEach(async () => {
      const post = await PostModel.create({
        ...testPost,
        userId: new Types.ObjectId(userId),
      });
      postId = post._id;
    });

    it("should get post by id", async () => {
      const res = await request(app)
        .get(`/posts/${postId.toString()}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(postId.toString());
      expect(res.body.text).toBe(testPost.text);
    });

    it("should return 404 for non-existent post", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/posts/${fakeId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 400 for invalid id format", async () => {
      const res = await request(app)
        .get("/posts/invalid_id")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe("PUT /posts/:id", () => {
    let postId: Types.ObjectId; // Use Types.ObjectId instead of mongoose.Types.ObjectId

    beforeEach(async () => {
      const post = await PostModel.create({
        ...testPost,
        userId: new mongoose.Types.ObjectId(userId),
      });
      postId = post._id;
    });

    it("should update post successfully", async () => {
      const updatedData = {
        text: "Updated text",
        title: "Updated title",
      };

      const res = await request(app)
        .put(`/posts/${postId.toString()}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updatedData);

      expect(res.status).toBe(200);
      expect(res.body.text).toBe(updatedData.text);
      expect(res.body.title).toBe(updatedData.title);
    });

    it("should fail to update non-existent post", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .put(`/posts/${fakeId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ text: "Updated text" });

      expect(res.status).toBe(404);
    });

    it("should fail to update post with invalid data types", async () => {
      const res = await request(app)
        .put(`/posts/${postId.toString()}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ title: 123 });

      expect(res.status).toBe(400);
    });

    it("should return 404 if item not found", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .put(`/posts/${fakeId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ title: "Updated", text: "Updated text" });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /posts/:id", () => {
    let postId: Types.ObjectId; // Use Types.ObjectId instead of mongoose.Types.ObjectId

    beforeEach(async () => {
      const post = await PostModel.create({
        ...testPost,
        userId: new mongoose.Types.ObjectId(userId),
      });
      postId = post._id;
    });

    it("should delete post successfully", async () => {
      const res = await request(app)
        .delete(`/posts/${postId.toString()}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      // Verify post is deleted
      const deletedPost = await PostModel.findById(postId);
      expect(deletedPost).toBeNull();
    });

    it("should fail to delete non-existent post", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .delete(`/posts/${fakeId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });

    it("should fail to delete post with invalid id format", async () => {
      const res = await request(app)
        .delete("/posts/invalid_id")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe("GET /posts/user/:userId", () => {
    beforeEach(async () => {
      await PostModel.deleteMany({});
      await PostModel.create([
        {
          ...testPost,
          userId: new Types.ObjectId(userId),
          title: "User Post 1",
        },
        {
          ...testPost,
          userId: new Types.ObjectId(userId),
          title: "User Post 2",
        },
        { ...testPost, userId: new Types.ObjectId(), title: "Other User Post" },
      ]);
    });

    it("should get all posts for specific user", async () => {
      const res = await request(app)
        .get(`/posts/user/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.length).toBe(2);
      expect(
        res.body.data.every((post: any) => post.userId._id === userId)
      ).toBeTruthy();
    });

    it("should return populated user data", async () => {
      const res = await request(app)
        .get(`/posts/user/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.body.data[0].userId).toHaveProperty("username");
      expect(res.body.data[0].userId).toHaveProperty("email");
    });

    it("should return empty array for non-existent user", async () => {
      const fakeUserId = new Types.ObjectId().toString();
      const res = await request(app)
        .get(`/posts/user/${fakeUserId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe("PUT /posts/:id authorization", () => {
    let otherUserPost: any;

    beforeEach(async () => {
      const otherUserId = new Types.ObjectId();
      otherUserPost = await PostModel.create({
        ...testPost,
        userId: otherUserId,
        title: "Other User's Post",
      });
    });

    it("should fail to update another user's post", async () => {
      const res = await request(app)
        .put(`/posts/${otherUserPost._id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ title: "Attempted Update" });

      expect(res.status).toBe(403);
      expect(res.text).toBe("Not authorized to update this post");
    });
  });
});
