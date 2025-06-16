const express = require('express');
const multer = require('multer');
const { createPost, getCelebrityPosts, getFeed, deletePost, updatePost, getMixedCelebrityFeed, getPostsByCelebrityId, toggleLikePost, addComment, deleteComment } = require('../controller/post');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

router.post('/', verifyToken, upload.single('image'), createPost);
router.get('/self', verifyToken, getCelebrityPosts);
router.get('/feed', verifyToken, getFeed);
router.put('/:id', verifyToken, upload.single('image'), updatePost);
router.delete('/:id', verifyToken, deletePost);
router.get('/feed/mixed', verifyToken, getMixedCelebrityFeed);
router.get('/by/:userId', verifyToken, getPostsByCelebrityId);
router.post('/:id/like', verifyToken, toggleLikePost);    
router.post('/:id/comment', verifyToken, addComment);     
router.delete('/:postId/comment/:commentId', verifyToken, deleteComment);

module.exports = router;