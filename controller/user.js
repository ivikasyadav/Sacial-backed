const User = require('../models/User');
const { notifyUserById } = require('../socket/socket');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user.id } }).select('name email role followers');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

exports.followUser = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const targetUserId = req.params.userId;

        if (currentUserId === targetUserId) {
            return res.status(400).json({ message: "You can't follow yourself." });
        }

        const currentUser = await User.findById(currentUserId);
        const targetUser = await User.findById(targetUserId);

        if (!targetUser || targetUser.role !== 'celebrity') {
            return res.status(400).json({ message: 'Can only follow users with role "celebrity".' });
        }

        if (!currentUser.following.includes(targetUserId)) {
            currentUser.following.push(targetUserId);
            targetUser.followers.push(currentUserId);

            await currentUser.save();
            await targetUser.save();
        }

        res.status(200).json({ message: 'Followed successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Something went wrong' });
    }
};


exports.getFollowedCelebrities = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('following', 'name email');
        res.status(200).json(user.following);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong' });
    }
};

exports.unfollowUser = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const targetUserId = req.params.userId;

        if (currentUserId === targetUserId) {
            return res.status(400).json({ message: "You can't unfollow yourself." });
        }

        const currentUser = await User.findById(currentUserId);
        const targetUser = await User.findById(targetUserId);

        if (!targetUser || targetUser.role !== 'celebrity') {
            return res.status(400).json({ message: 'Can only unfollow users with role "celebrity".' });
        }

        // Remove if exists
        currentUser.following = currentUser.following.filter(
            (id) => id.toString() !== targetUserId
        );  

        targetUser.followers = targetUser.followers.filter(
            (id) => id.toString() !== currentUserId
        );

        await currentUser.save();
        await targetUser.save();

        res.status(200).json({ message: 'Unfollowed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong' });
    }
};

  