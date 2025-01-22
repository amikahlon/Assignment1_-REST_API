import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app";
import { Express } from "express";

dotenv.config();

const port = process.env.PORT || 3000;

export const initApp = async (): Promise<Express> => {
  try {
    if (!process.env.DB_CONNECT) {
      throw new Error("DB_CONNECT is not defined");
    }

    await mongoose.connect(process.env.DB_CONNECT);
    console.log("Connected to the database");

    return app;
  } catch (err) {
    console.error("Error connecting to the database:", err);
    throw err;
  }
};

// Run server directly (not in test mode)
if (require.main === module) {
  initApp()
    .then((app) => {
      app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
        console.log(
          `Swagger docs available at http://localhost:${port}/api-docs`
        );
      });
    })
    .catch((err) => {
      console.error("Failed to initialize app:", err);
      process.exit(1);
    });
}

export default app;
