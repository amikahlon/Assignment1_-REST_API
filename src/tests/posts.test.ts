import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import postsModel from "../models/post_model";
import userModel from "../models/user_model";
import { Express } from "express";

let app: Express;

type UserInfo = {
  email: string;
  password: string;
  token?: string;
  _id?: string;
};

const userInfo: UserInfo = {
  email: "eliav@gmail.com",
  password: "123456",
};

beforeAll(async () => {
  app = await initApp();
  await postsModel.deleteMany();
  await userModel.deleteMany();

  // Register and login user
  await request(app).post("/auth/register").send(userInfo);
  const response = await request(app).post("/auth/login").send(userInfo);
  userInfo.token = response.body.accessToken;
  userInfo._id = response.body._id;
});

afterAll(async () => {
  await mongoose.connection.close();
});

const testPost1 = {
  sender: "Eliav",
  title: "My First Post",
  content: "This is my first post",
};

const testPost2 = {
  sender: "Eliav2",
  title: "My Second Post",
  content: "This is my second post",
};

const testPostFail = {
  content: "Missing title and sender",
};

describe("Posts API Tests", () => {
  let postId = "";

  test("Get all posts (initially empty)", async () => {
    const response = await request(app).get("/posts");
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });

  test("Create a new post successfully", async () => {
    const response = await request(app)
      .post("/posts")
      .set("Authorization", Bearer ${userInfo.token}) // תיקון תחבירי
      .send(testPost1);

    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe(testPost1.title);
    expect(response.body.content).toBe(testPost1.content);

    postId = response.body._id;
  });

  test("Get post by ID", async () => {
    const response = await request(app).get(/posts/${postId}); // תיקון לתחביר של template literal
    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBe(postId);
    expect(response.body.title).toBe(testPost1.title);
  });

  test("Fail to get post with invalid ID", async () => {
    const response = await request(app).get(/posts/${postId}123); // תיקון לתחביר של template literal
    expect(response.statusCode).toBe(404);
  });

  test("Fail to create post with missing fields", async () => {
    const response = await request(app)
      .post("/posts")
      .set("Authorization", Bearer ${userInfo.token}) // תיקון תחבירי
      .send(testPostFail);

    expect(response.statusCode).toBe(400);
  });

  test("Create a second post successfully", async () => {
    const response = await request(app)
      .post("/posts")
      .set("Authorization", Bearer ${userInfo.token}) // תיקון תחבירי
      .send(testPost2);

    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe(testPost2.title);
  });

  test("Get posts by sender", async () => {
    const response = await request(app).get(/posts?sender=${userInfo._id}); // תיקון לתחביר של template literal
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].sender).toBe(userInfo._id);
  });

  test("Delete a post successfully", async () => {
    const response = await request(app)
      .delete(/posts/${postId}) // תיקון לתחביר של template literal
      .set("Authorization", Bearer ${userInfo.token}); // תיקון תחבירי

    expect(response.statusCode).toBe(200);

    const responseAfterDelete = await request(app).get(/posts/${postId}); // תיקון לתחביר של template literal
    expect(responseAfterDelete.statusCode).toBe(404);
  });

  test("Fail to delete a post with invalid ID", async () => {
    const response = await request(app)
      .delete(/posts/${postId}123) // תיקון לתחביר של template literal
      .set("Authorization", Bearer ${userInfo.token}); // תיקון תחבירי
    expect(response.statusCode).toBe(404);
  });
});