const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const multer = require('multer'); // Import multer
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'frontend/public/images/uploads');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


// Create Post 
router.post('/', upload.single('img'), async (req, res) => { 

    try {

        const postData = {
            userId: req.body.userId, 
            desc: req.body.desc,
        };

        if (req.file) {
            postData.img = `/images/uploads/${req.file.filename}`;
        }

        const newPost = new Post(postData);
        const savedPost = await newPost.save();

        res.status(200).json(savedPost);

    } catch (err) {
        res.status(500).json(err);
    }

});


// Update Post
router.put('/:id', async (req, res) => {

    try {

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json("Пост не найден");
        }

        if (post.userId.toString() === req.body.userId) { 
            await post.updateOne({ $set: req.body });
            res.status(200).json("Пост был обновлен");
        } else {
            res.status(403).json("Вы можете обновлять только свои посты");
        }

    } catch (err) {
        res.status(500).json(err);
    }

});


// Delete Post
router.delete('/:id', async (req, res) => {

    try {

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json("Пост не найден");
        }

        if (post.userId.toString() === req.body.userId) {
            await post.deleteOne(); 
            res.status(200).json("Пост был удален");
        } else {
            res.status(403).json("Вы можете удалять только свои посты");
        }

    } catch (err) {
        res.status(500).json(err);
    }

});


// Like/Dislike Post
router.put('/:id/like', async (req, res) => {

    try {

        const post = await Post.findById(req.params.id);

        if (!post.likes.includes(req.body.userId)) {
            await post.updateOne({ $push: { likes: req.body.userId } });
            res.status(200).json("Посту поставили лайк");
        } else {
            await post.updateOne({ $pull: { likes: req.body.userId } });
            res.status(200).json("Посту поставили дизлайк")
        }

    } catch (err) {
        res.status(500).json(err);
    }

});


// Get Post
router.get('/:id', async (req, res) => {

    try {
        const post = await Post.findById(req.params.id);
        res.status(200).json(post);
    } catch (err) {
        res.status(500).json(err);
    }

});


// Get Timeline Post
router.get('/timeline/all', async (req, res) => {

    try {

        const currentUser = await User.findById(req.body.userId);
        const userPosts = await Post.find({ userId: currentUser._id });
        const friendPosts = await Promise.all(
            currentUser.followings.map((friendId) => {
                return Post.find({ userId: friendId });
            })
        );

        res.json(userPosts.concat(...friendPosts));

    } catch (err) {
        res.status(500).json(err);
    }

});


// Add Comment to Post
router.post('/:id/comment', async (req, res) => {

    try {

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json("Post not found");
        }

        const newComment = {
            userId: req.body.userId,
            text: req.body.text
        };

        await post.updateOne({ $push: { comments: newComment } });

        res.status(200).json("Comment added successfully");

    } catch (err) {
        res.status(500).json(err);
    }

});


// Get Comments for Post
router.get('/:id/comments', async (req, res) => {

    try {

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json("Post not found");
        }

        res.status(200).json(post.comments);

    } catch (err) {
        res.status(500).json(err);
    }

});


// Delete Comment
router.delete('/:postId/comment/:commentId', async (req, res) => {

    try {

        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json("Post not found");
        }

        const comment = post.comments.id(req.params.commentId);

        if (!comment) {
            return res.status(404).json("Comment not found");
        }

        if (comment.userId !== req.body.userId && post.userId !== req.body.userId) {
            return res.status(403).json("You can delete only your comments or comments on your posts");
        }

        await post.updateOne({ $pull: { comments: { _id: req.params.commentId } }});

        res.status(200).json("Comment deleted successfully");

    } catch (err) {
        res.status(500).json(err);
    }

});


module.exports = router;