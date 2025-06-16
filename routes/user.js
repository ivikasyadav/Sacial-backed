const express = require('express');
const User = require('../models/User');
const router = express.Router();
const { followUser, getFollowedCelebrities, getAllUsers, unfollowUser } = require('../controller/user');

const { verifyToken } = require('../middleware/auth');

router.post('/follow/:userId', verifyToken, followUser);
router.get('/', verifyToken, getAllUsers);

// Get followed celebrity feed
router.get('/following', verifyToken, getFollowedCelebrities);
router.post('/unfollow/:userId', verifyToken, unfollowUser);
router.get('/all', verifyToken, async (req, res) => {
    try {
        const users = await User.find({ role: 'celebrity' }, 'name _id role');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});




module.exports = router;
