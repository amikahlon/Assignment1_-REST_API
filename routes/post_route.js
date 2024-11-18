const express = require('express');
const {
    addPost,
    getPosts,
    getPostById,
    updatePost,
    deletePost,
} = require('../controllers/Post_controller');

const router = express.Router();

// מסלול להוספת פוסט חדש
router.post('/', addPost);

// מסלול לקבלת כל הפוסטים
// או פוסט ספציפי על ידי שולח תלוי אם יש פרמטרים מועברים אחרי סימן שאלה או לא 
router.get('/', getPosts);

// מסלול לקבלת פוסט לפי ID
router.get('/:id', getPostById);

// מסלול לעדכון פוסט
router.put('/:id', updatePost);

// מסלול למחיקת פוסט
router.delete('/:id', deletePost);

module.exports = router;
