const { notifyFollowers, broadcastToAllClients } = require('../socket/socket');
const fs = require('fs');
const path = require('path');
const Post = require('../models/Post');
const User = require('../models/User');
const mongoose = require('mongoose');

exports.createPost = async (req, res) => {
    try {
        const { caption } = req.body;
        const image = req.file ? req.file.filename : null;

        const post = await Post.create({
            caption,
            image,
            celebrityId: req.user.id,
        });

        const followers = await User.find({ following: req.user.id });
        notifyFollowers(followers.map(f => f._id.toString()), {
            type: 'create',
            post,
        });

        res.status(201).json(post);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create post' });
    }
};


exports.getCelebrityPosts = async (req, res) => {
    const posts = await Post.find({ celebrityId: req.user.id }).sort('-createdAt');
    res.json(posts);
};

exports.getFeed = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        console.log("User found:", user);

        const followingIds = user.following.map(id => new mongoose.Types.ObjectId(id));
        console.log("Following IDs:", followingIds);

        const posts = await Post.find({ celebrityId: { $in: followingIds } })
            .sort('-createdAt')
            .populate('celebrityId', 'name');

        console.log("Posts found:", posts);

        res.json(posts);
    } catch (err) {
        console.error("Feed fetch error:", err);
        res.status(500).json({ error: 'Failed to fetch feed' });
    }
};
exports.updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { caption } = req.body;
        const post = await Post.findById(id);

        if (!post) return res.status(404).json({ error: 'Post not found' });
        if (String(post.celebrityId) !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

        post.caption = caption || post.caption;

        if (req.file) {
            if (post.image) {
                fs.unlinkSync(path.join(__dirname, '..', 'uploads', post.image));
            }
            post.image = req.file.filename;
        }

        await post.save();

        const followers = await User.find({ following: req.user.id });
        notifyFollowers(followers.map(f => f._id.toString()), {
            type: 'update',
            post,
        });

        res.json(post);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update post' });
    }
};


// Delete  post
exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id);

        if (!post) return res.status(404).json({ error: 'Post not found' });
        if (String(post.celebrityId) !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

        if (post.image) {
            fs.unlinkSync(path.join(__dirname, '..', 'uploads', post.image));
        }

        await post.deleteOne();

        const followers = await User.find({ following: req.user.id });
        notifyFollowers(followers.map(f => f._id.toString()), {
            type: 'delete',
            postId: id,
        });

        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete post' });
    }
};


exports.getMixedCelebrityFeed = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ error: 'User not found' });

        const followingIds = user.following.map(id => new mongoose.Types.ObjectId(id));
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

        const followedRecentPosts = await Post.find({
            celebrityId: { $in: followingIds },
            createdAt: { $gte: fifteenMinutesAgo },
        })
            .sort('-createdAt')
            .populate('celebrityId', 'name');

        const followedRecentPostIds = followedRecentPosts.map(post => post._id);

        const allCelebrityUsers = await User.find({ role: 'celebrity' }).select('_id');
        const allCelebrityIds = allCelebrityUsers.map(u => u._id);

        const remainingPosts = await Post.find({
            celebrityId: { $in: allCelebrityIds },
            _id: { $nin: followedRecentPostIds },
        })
            .sort('-createdAt')
            .limit(50)
            .populate('celebrityId', 'name');
        const mixedFeed = [...followedRecentPosts, ...remainingPosts];

        res.status(200).json(mixedFeed);
    } catch (err) {
        console.error('Error in getMixedCelebrityFeed:', err);
        res.status(500).json({ error: 'Failed to fetch mixed feed' });
    }
};
exports.getPostsByCelebrityId = async (req, res) => {
    const { userId } = req.params;
    try {
        const posts = await Post.find({ celebrityId: userId })
            .sort('-createdAt')
            .populate('celebrityId', 'name'); 

        res.status(200).json(posts);
    } catch (err) {
        console.error('Failed to get posts for celebrity:', err);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
};