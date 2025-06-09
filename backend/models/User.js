const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 20
    },

    age: {
        type: Number,
        required: true,
        min: 1
    },

    email: {
        type: String,
        required: true,
        unique: true,
        maxlength: 50
    },

    password: {
        type: String,
        required: true,
        minlength: 6
    },

    profileAvatar: {
        type: String,
        default: '/images/default-avatar.jpg'
    },

    profileCover: {
        type: String,
        default: '/images/default-cover.jpg'
    },

    city: {
        type: String,
        default: ''
    },

    from: {
        type: String,
        default: ''
    },

    relationship: {
        type: Number,
        enum: [1, 2, 3] // 1 - не женат/не замужем, 2 - в отношениях, 3 - женат/замужем
    },

    followers: {
        type: Array,
        default: []
    },

    followings: {
        type: Array,
        default: []
    },

    isAdmin: {
        type: Boolean,
        default: false
    },

    desc: {
        type: String,
        maxlength: 100,
        default: ''
    },

    privateProfile: {
        type: Boolean,
        default: false
    },

    showActivity: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);