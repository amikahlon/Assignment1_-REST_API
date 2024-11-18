const Comment = require('../models/Comment_model');
const Post = require('../models/Post_model');

// Add a New Comment
const addComment = async (req, res) => {
    try {
        // בדיקה אם הפוסט קיים
        const postExists = await Post.findById(req.body.postId);
        if (!postExists) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // יצירת התגובה ושמירתה
        const comment = new Comment(req.body);
        const savedComment = await comment.save();
        res.status(201).json(savedComment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get All Comments for a Post
const getCommentsByPostId = async (req, res) => {
    try {
        const comments = await Comment.find({ postId: req.params.postId });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a Comment
const updateComment = async (req, res) => {
    try {
        const updatedComment = await Comment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedComment) return res.status(404).json({ message: 'Comment not found' });
        res.json(updatedComment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a Comment
const deleteComment = async (req, res) => {
    try {
        const deletedComment = await Comment.findByIdAndDelete(req.params.id);
        if (!deletedComment) return res.status(404).json({ message: 'Comment not found' });
        res.json(deletedComment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    addComment,
    getCommentsByPostId,
    updateComment,
    deleteComment,
};
