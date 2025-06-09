const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    
    userId: {
        type: String,
        required: true
    },

    desc: {
        type: String,
        max: 500,
        default: ''
    },

    img: {
        type: String,
        default: ''
    },

    likes: {
        type: Array,
        default: []
    },

    comments: [{
        userId: String,
        text: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]

}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);