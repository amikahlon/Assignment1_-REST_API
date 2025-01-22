import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import app from "../app";
import UserModel from "../models/user_model";

dotenv.config();

const testUser = {
  username: "testuser",
  email: "test@test.com",
  password: "password123",
};

beforeAll(async () => {
  process.env.TOKEN_SECRET = "test_secret_key_123";
  await mongoose.connect(
    process.env.TEST_DB_URL || "mongodb://localhost:27017/test_db",
    {}
  );
});

afterAll(async () => {
  await UserModel.deleteMany({});
  await mongoose.connection.close();
});

beforeEach(async () => {
  await UserModel.deleteMany({});
});

describe("Auth Endpoints", () => {
  describe("POST /auth/register", () => {
    it("should register a new user successfully", async () => {
      const res = await request(app).post("/auth/register").send(testUser);
      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toHaveProperty("accessToken");
      expect(res.body.data).toHaveProperty("refreshToken");
    });

    it("should fail if email already exists", async () => {
      await request(app).post("/auth/register").send(testUser);
      const res = await request(app).post("/auth/register").send(testUser);
      expect(res.status).toBe(400);
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      // Make sure to wait for the registration to complete
      await request(app).post("/auth/register").send(testUser);
    });

    it("should login successfully with correct credentials", async () => {
      const loginResponse = await request(app).post("/auth/login").send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.status).toBe("success");
      expect(loginResponse.body.data).toHaveProperty("accessToken");
      expect(loginResponse.body.data).toHaveProperty("refreshToken");
    });

    it("should fail with incorrect password", async () => {
      const res = await request(app).post("/auth/login").send({
        email: testUser.email,
        password: "wrongpassword",
      });
      expect(res.status).toBe(401);
    });

    it("should fail with non-existent email", async () => {
      const res = await request(app).post("/auth/login").send({
        email: "nonexistent@test.com",
        password: testUser.password,
      });
      expect(res.status).toBe(401);
    });

    it("should fail with missing credentials", async () => {
      const res = await request(app).post("/auth/login").send({});
      expect(res.status).toBe(400);
    });
  });

  describe("POST /auth/logout", () => {
    let refreshToken: string;

    beforeEach(async () => {
      const registerRes = await request(app)
        .post("/auth/register")
        .send(testUser);
      refreshToken = registerRes.body.data.refreshToken;
    });

    it("should logout successfully", async () => {
      const res = await request(app)
        .post("/auth/logout")
        .send({ refreshToken });
      expect(res.status).toBe(200);
    });

    it("should fail with invalid refresh token", async () => {
      const res = await request(app)
        .post("/auth/logout")
        .send({ refreshToken: "invalid_token" });
      expect(res.status).toBe(403);
    });

    it("should fail with missing refresh token", async () => {
      const res = await request(app).post("/auth/logout").send({});
      expect(res.status).toBe(400);
    });
  });

  describe("POST /auth/refresh", () => {
    let refreshToken: string;

    beforeEach(async () => {
      const registerRes = await request(app)
        .post("/auth/register")
        .send(testUser);
      refreshToken = registerRes.body.data.refreshToken;
    });

    it("should refresh tokens successfully", async () => {
      const res = await request(app)
        .post("/auth/refresh")
        .send({ refreshToken });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
    });

    it("should fail with invalid refresh token", async () => {
      const res = await request(app)
        .post("/auth/refresh")
        .send({ refreshToken: "invalid_token" });
      expect(res.status).toBe(403);
    });

    it("should fail with missing refresh token", async () => {
      const res = await request(app).post("/auth/refresh").send({});
      expect(res.status).toBe(400);
    });
  });

  describe("Registration Validation", () => {
    it("should fail with invalid email format", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send({
          ...testUser,
          email: "invalid-email",
        });
      expect(res.status).toBe(400);
    });

    it("should fail with short password", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          ...testUser,
          password: "123",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
    });

    it("should fail with short username", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send({
          ...testUser,
          username: "ab",
        });
      expect(res.status).toBe(400);
    });
  });

  describe("Auth Middleware", () => {
    let accessToken: string;

    beforeEach(async () => {
      const registerRes = await request(app)
        .post("/auth/register")
        .send(testUser);
      accessToken = registerRes.body.data.accessToken;
    });

    it("should allow access with valid token", async () => {
      const res = await request(app)
        .get("/posts")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).not.toBe(401);
    });

    it("should deny access with invalid token", async () => {
      const res = await request(app)
        .get("/posts")
        .set("Authorization", "Bearer invalid_token");
      expect(res.status).toBe(403);
    });

    it("should deny access with missing token", async () => {
      const res = await request(app).get("/posts");
      expect(res.status).toBe(401);
    });

    it("should deny access with malformed authorization header", async () => {
      const res = await request(app)
        .get("/posts")
        .set("Authorization", accessToken);
      expect(res.status).toBe(401);
    });
  });
});
