import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import postsRoutes from "./routes/posts_routes";
import commentsRoutes from "./routes/comments_routes";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(process.env.DB_CONNECT);
const db = mongoose.connection;
db.on("error", (error) => console.log(error));
db.once("open", () => console.log("Connection successfully !"));

app.use("/posts", postsRoutes);
app.use("/comments", commentsRoutes);

app.listen(port, () => {
  console.log(`Listening at port: ${port}`);
});
