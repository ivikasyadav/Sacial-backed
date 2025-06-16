const { notifyFollowers } = require('../socket/socket');
const fs = require('fs');
const path = require('path');
const Post = require('../models/Post');
const User = require('../models/User');
const mongoose = require('mongoose');

const populatePost = (query) => {
    return query
        .populate('celebrityId', 'name')
        .populate({
            path: 'likes',
            select: 'name _id' 
        })
        .populate({
            path: 'comments.user', 
            select: 'name _id'    
        });
};

exports.createPost = async (req, res) => {
    try {
        const { caption } = req.body;
        const image = req.file ? req.file.filename : null;

        let post = await Post.create({
            caption,
            image,
            celebrityId: req.user.id,
        });

        post = await populatePost(Post.findById(post._id));

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
    try {
        const posts = await populatePost(Post.find({ celebrityId: req.user.id })).sort('-createdAt');
        res.json(posts);
    } catch (err) {
        console.error("Get celebrity posts error:", err);
        res.status(500).json({ error: 'Failed to fetch celebrity posts' });
    }
};

exports.getFeed = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const followingIds = user.following.map(id => new mongoose.Types.ObjectId(id));

        const posts = await populatePost(Post.find({ celebrityId: { $in: followingIds } })).sort('-createdAt');

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
            if (post.image) {                fs.unlinkSync(path.join(__dirname, '..', 'uploads', post.image));
            }
            post.image = req.file.filename;
        }

        await post.save();
        const updatedPost = await populatePost(Post.findById(id));

        const followers = await User.find({ following: req.user.id });
        notifyFollowers(followers.map(f => f._id.toString()), {
            type: 'update',
            post: updatedPost,
        });

        res.json(updatedPost);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update post' });
    }
};

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
            celebrityId: req.user.id
        });

        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        console.error(err);
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

        const followedRecentPosts = await populatePost(Post.find({
            celebrityId: { $in: followingIds },
            createdAt: { $gte: fifteenMinutesAgo },
        })).sort('-createdAt');

        const followedRecentPostIds = followedRecentPosts.map(post => post._id);

        const allCelebrityUsers = await User.find({ role: 'celebrity' }).select('_id');
        const allCelebrityIds = allCelebrityUsers.map(u => u._id);

        const remainingPosts = await populatePost(Post.find({
            celebrityId: { $in: allCelebrityIds },
            _id: { $nin: followedRecentPostIds },
        })).sort('-createdAt').limit(50);

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
        const posts = await populatePost(Post.find({ celebrityId: userId })).sort('-createdAt');

        res.status(200).json(posts);
    } catch (err) {
        console.error('Failed to get posts for celebrity:', err);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
};
exports.toggleLikePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id; // ID of the logged-in user

        let post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const hasLiked = post.likes.includes(userId);

        if (hasLiked) {            post.likes = post.likes.filter(id => id.toString() !== userId.toString());
        } else {            post.likes.push(userId);
        }

        await post.save();
        post = await populatePost(Post.findById(postId));
        const celebrityFollowers = await User.find({ following: post.celebrityId._id }); // Use post.celebrityId._id as it's populated
        notifyFollowers(celebrityFollowers.map(f => f._id.toString()), {        });

        res.status(200).json({ message: hasLiked ? 'Post unliked' : 'Post liked', post });

    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ error: 'Failed to toggle like' });
    }
};

exports.addComment = async (req, res) => {
    try {
        const postId = req.params.id;
        const { text } = req.body;
        const userId = req.user.id; 

        if (!text || text.trim() === '') {
            return res.status(400).json({ message: 'Comment text cannot be empty' });
        }

        let post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const newComment = {
            user: userId,
            text: text.trim(),
            createdAt: new Date(),
        };

        post.comments.push(newComment);
        await post.save();

        post = await populatePost(Post.findById(postId));

        const celebrityFollowers = await User.find({ following: post.celebrityId._id });
        notifyFollowers(celebrityFollowers.map(f => f._id.toString()), {
            type: 'update', 
            post: post, 
        });

        const returnedComment = post.comments.find(c => c.text === newComment.text && c.user._id.toString() === userId);

        res.status(201).json({ message: 'Comment added successfully', comment: returnedComment, post });

    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const userId = req.user.id; 

        let post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const commentIndex = post.comments.findIndex(c => c._id.toString() === commentId);

        if (commentIndex === -1) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const comment = post.comments[commentIndex];

        if (comment.user.toString() !== userId.toString() && post.celebrityId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        post.comments.splice(commentIndex, 1); 
        await post.save();

        post = await populatePost(Post.findById(postId));

        const celebrityFollowers = await User.find({ following: post.celebrityId._id });
        notifyFollowers(celebrityFollowers.map(f => f._id.toString()), {
            type: 'update',
            post: post, 
            deletedCommentId: commentId
        });


        res.status(200).json({ message: 'Comment deleted successfully', postId, commentId });

    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
};
