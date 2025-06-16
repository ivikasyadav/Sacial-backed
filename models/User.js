const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,                               
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['public', 'celebrity'],
            default: 'public',
        },
        following: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        followers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
    },
    {
        timestamps: true, 
    }
);

module.exports = mongoose.model('User', userSchema);
