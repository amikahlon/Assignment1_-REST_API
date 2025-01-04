const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    content: String,
    commenter: String, // commenter ID
});

module.exports = mongoose.model('Comment', commentSchema);
