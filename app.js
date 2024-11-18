const postRoutes = require("./routes/Post_route");
const CommentRoutes = require("./routes/Comment_route");
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const dotenv = require("dotenv").config();
const port = process.env.port;
const mongoose = require("mongoose");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(process.env.DB_CONNECT);
const db = mongoose.connection;
db.on("error", (error) => console.log(error));
db.once("open", () => console.log("Connection successfully !"));

app.use("/posts", postRoutes);
app.use("/comments", CommentRoutes);

app.listen(port, () => {
    console.log(`Listening at port: ${port}`);
});




