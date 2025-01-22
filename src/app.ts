import express from "express";
import bodyParser from "body-parser";
import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import posts_routes from "./routes/post_route";
import comments_routes from "./routes/Comment_route";
import auth_routes from "./routes/auth_routes";

const app = express();

// Middleware לעיבוד JSON ונתונים
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// הגדרת Swagger
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Social Network API",
      version: "1.0.0",
      description: "REST server for posts, comments, and authentication",
    },
    servers: [{ url: "http://localhost:3000" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./dist/routes/*.js"], // נתיבים לקבצי המסלולים
};

const swaggerDocs = swaggerJsDoc(options);
app.use(
  "/api-docs",
  swaggerUI.serve,
  swaggerUI.setup(swaggerDocs, {
    swaggerOptions: {
      persistAuthorization: true, // שמירה על ה-Bearer Token
    },
  })
);

// Routes
app.use("/posts", posts_routes);
app.use("/comments", comments_routes);
app.use("/auth", auth_routes);

export default app; // Make sure this is a default export
