const express = require('express');
const multer = require('multer');
const { createPost, getCelebrityPosts, getFeed, deletePost, updatePost, getMixedCelebrityFeed, getPostsByCelebrityId } = require('../controller/post');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Configure multer to store images in /uploads
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

// Routes
router.post('/', verifyToken, upload.single('image'), createPost);
router.get('/self', verifyToken, getCelebrityPosts);
router.get('/feed', verifyToken, getFeed);
router.put('/:id', verifyToken, upload.single('image'), updatePost); // Update post by ID
router.delete('/:id', verifyToken, deletePost); // Delete post by ID
router.get('/feed/mixed', verifyToken, getMixedCelebrityFeed);
router.get('/by/:userId', verifyToken, getPostsByCelebrityId);

module.exports = router;
