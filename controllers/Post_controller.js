const Post = require('../models/Post_model');

// הוספת פוסט חדש
const addPost = async (req, res) => {
    try {
        const post = new Post(req.body);
        const savedPost = await post.save();
        res.status(201).json(savedPost);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// קבלת כל הפוסטים
const getPosts = async (req, res) => {
    try {
        let posts;

        if (req.query.sender == null) {
            // חיפוש כל הפוסטים
            posts = await Post.find();
        } else {
            // חיפוש פוסטים לפי sender
            posts = await Post.find({ sender: req.query.sender });
        }

        // בדיקה אם אין תוצאות
        if (posts.length === 0) {
            return res.status(404).json({ message: "There are no posts for this user" });
        }
        // אם נמצאו פוסטים, החזר אותם
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// קבלת פוסט לפי ID
const getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// קבלת פוסטים לפי מזהה שולח
const getPostsBySender = async (req, res) => {
    try {
        console.log("Query sender:", req.query.sender);
        const posts = await Post.find({ sender: req.query.sender });
        console.log(req.query.sender);
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// עדכון פוסט
const updatePost = async (req, res) => {
    try {
        const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedPost) return res.status(404).json({ message: 'Post not found' });
        res.json(updatedPost);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// מחיקת פוסט
const deletePost = async (req, res) => {
    try {
        const deletedPost = await Post.findByIdAndDelete(req.params.id);
        if (!deletedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json({
            message: 'Post deleted successfully',
            post: deletedPost
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


module.exports = {
    addPost,
    getPosts,
    getPostById,
    updatePost,
    deletePost,
};
