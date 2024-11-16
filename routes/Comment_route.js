const express = require('express');
const {
    addComment,
    getCommentsByPostId,
    updateComment,
    deleteComment,
} = require('../controllers/Comment_controller');

const router = express.Router();

router.post('/', addComment); // Add a New Comment
router.get('/:postId', getCommentsByPostId); // Get All Comments for a Post
router.put('/:id', updateComment); // Update a Comment
router.delete('/:id', deleteComment); // Delete a Comment

module.exports = router;
