import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import { Express } from "express";
import userModel from "../models/user_model";
import postsModel from "../models/post_model";

let app: Express;

beforeAll(async () => {
  app = await initApp();
  await userModel.deleteMany();
  await postsModel.deleteMany();
});

afterAll(async () => {
  await mongoose.connection.close();
});

type UserInfo = {
  username: string;
  email: string;
  password: string;
  accessToken?: string;
  refreshToken?: string;
  _id?: string;
};

const userInfo: UserInfo = {
  username: "ami",
  email: "ami@gmail.com",
  password: "123456",
};

describe("Authentication Tests", () => {
  describe("Registration", () => {
    test("should successfully register a new user", async () => {
      const response = await request(app).post("/auth/register").send(userInfo);
      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty("_id");
    });

    test("should fail registering with existing email", async () => {
      const response = await request(app).post("/auth/register").send(userInfo);
      expect(response.statusCode).toBe(400);
    });

    test("should fail registering with invalid email format", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          ...userInfo,
          email: "invalid-email",
        });
      expect(response.statusCode).toBe(400);
    });

    test("should fail registering with short username", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          ...userInfo,
          username: "ab", // Less than 3 characters
        });
      expect(response.statusCode).toBe(400);
    });

    test("should fail registering with short password", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          ...userInfo,
          password: "12345", // Less than 6 characters
        });
      expect(response.statusCode).toBe(400);
    });
  });

  describe("Login", () => {
    test("should successfully login and return tokens", async () => {
      const response = await request(app).post("/auth/login").send({
        email: userInfo.email,
        password: userInfo.password,
      });

      expect(response.statusCode).toBe(200);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body._id).toBeDefined();

      userInfo.accessToken = response.body.accessToken;
      userInfo.refreshToken = response.body.refreshToken;
      userInfo._id = response.body._id;
    });

    test("should fail login with wrong password", async () => {
      const response = await request(app).post("/auth/login").send({
        email: userInfo.email,
        password: "wrongpassword",
      });
      expect(response.statusCode).toBe(401);
    });

    test("should fail login with non-existent email", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "amimami@gmail.com",
        password: userInfo.password,
      });
      expect(response.statusCode).toBe(401);
    });

    test("should generate unique access tokens for each login", async () => {
      const response = await request(app).post("/auth/login").send({
        email: userInfo.email,
        password: userInfo.password,
      });
      expect(response.body.accessToken).not.toEqual(userInfo.accessToken);
    });
  });

  describe("Protected Routes Access", () => {
    test("should fail accessing protected route without token", async () => {
      const response = await request(app).post("/posts").send({
        title: "Test Post",
        content: "Test Content",
      });
      expect(response.statusCode).toBe(401);
    });

    test("should access protected route with valid token", async () => {
      const response = await request(app)
        .post("/posts")
        .set("Authorization", `jwt ${userInfo.accessToken}`)
        .send({
          title: "Test Post",
          content: "Test Content",
        });
      expect(response.statusCode).toBe(201);
    });

    test("should fail accessing protected route with invalid token", async () => {
      const response = await request(app)
        .post("/posts")
        .set("Authorization", "jwt invalidtoken")
        .send({
          title: "Test Post",
          content: "Test Content",
        });
      expect(response.statusCode).toBe(401);
    });
  });

  describe("Token Refresh", () => {
    test("should successfully refresh access token", async () => {
      const response = await request(app).post("/auth/refresh").send({
        refreshToken: userInfo.refreshToken,
      });

      expect(response.statusCode).toBe(200);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();

      userInfo.accessToken = response.body.accessToken;
      userInfo.refreshToken = response.body.refreshToken;
    });

    test("should prevent refresh token reuse", async () => {
      // First refresh - should succeed
      const response1 = await request(app).post("/auth/refresh").send({
        refreshToken: userInfo.refreshToken,
      });
      expect(response1.statusCode).toBe(200);

      // Second refresh with same token - should fail
      const response2 = await request(app).post("/auth/refresh").send({
        refreshToken: userInfo.refreshToken,
      });
      expect(response2.statusCode).toBe(401);
    });

    jest.setTimeout(10000);
    test("should handle access token expiration", async () => {
      // Login to get fresh tokens
      const loginResponse = await request(app).post("/auth/login").send({
        email: userInfo.email,
        password: userInfo.password,
      });
      userInfo.accessToken = loginResponse.body.accessToken;
      userInfo.refreshToken = loginResponse.body.refreshToken;

      // Wait for access token to expire
      await new Promise((resolve) => setTimeout(resolve, 6000));

      // Try to access protected route with expired token
      const expiredAccess = await request(app)
        .post("/posts")
        .set("Authorization", `jwt ${userInfo.accessToken}`)
        .send({
          title: "Test Post",
          content: "Test Content",
        });
      expect(expiredAccess.statusCode).toBe(401);

      // Refresh token
      const refreshResponse = await request(app).post("/auth/refresh").send({
        refreshToken: userInfo.refreshToken,
      });
      expect(refreshResponse.statusCode).toBe(200);
      userInfo.accessToken = refreshResponse.body.accessToken;

      // Access protected route with new token
      const newAccess = await request(app)
        .post("/posts")
        .set("Authorization", `jwt ${userInfo.accessToken}`)
        .send({
          title: "Test Post",
          content: "Test Content",
        });
      expect(newAccess.statusCode).toBe(201);
    });
  });

  describe("Logout", () => {
    test("should successfully logout and invalidate refresh token", async () => {
      // Logout
      const logoutResponse = await request(app).post("/auth/logout").send({
        refreshToken: userInfo.refreshToken,
      });
      expect(logoutResponse.statusCode).toBe(200);

      // Try to refresh with invalidated token
      const refreshResponse = await request(app).post("/auth/refresh").send({
        refreshToken: userInfo.refreshToken,
      });
      expect(refreshResponse.statusCode).toBe(401);
    });

    test("should fail logout with invalid refresh token", async () => {
      const response = await request(app).post("/auth/logout").send({
        refreshToken: "invalid-token",
      });
      expect(response.statusCode).toBe(400);
    });
  });
});
