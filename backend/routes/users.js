const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require("bcryptjs");


// Update User
router.put('/:id', async (req, res) => {

    if (req.body.userId === req.params.id || req.body.isAdmin) {

        if (req.body.password) {
            try {
                const salt = await bcrypt.genSalt(10);
                req.body.password = await bcrypt.hash(req.body.password, salt);
            } catch (err) {
                return res.status(500).json(err);
            }
        }

        try {
            const user = await User.findByIdAndUpdate(req.params.id, { set: req.body });
            res.status(200).json("Данные пользователя успешно обновлены");
        } catch (err) {
            return res.status(500).json(err);
        }

    } else {
        return res.status(403).json("Вы можете обновить только свой аккаунт");
    }

});


// Delete User
router.delete('/:id', async (req, res) => {

    if (req.body.userId === req.params.id || req.body.isAdmin) {

        try {
            const user = await User.findByIdAndDelete(req.params.id);
            res.status(200).json("Аккаунт пользователя успешно удалён");
        } catch (err) {
            return res.status(500).json(err);
        }

    } else {
        return res.status(403).json("Вы можете удалить только свой аккаунт");
    }

});


// Get User
router.get('/:id', async (req, res) => {

    try {
        const user = await User.findById(req.params.id);
        const { password, updatedAt, ...other } = user.__doc;
        res.status(200).json(other);

    } catch (err) {
        res.status(500).json(err);
    }

});


// Follow User
router.put("/:id/follow", async (req, res) => {

    if (req.body.userId !== req.params.id) {

        try {

            const user = await User.findById(req.params.id);
            const currentUser = await User.findById(req.body.userId);

            if (!user.followers.includes(req.body.userId)) {

                await user.updateOne({ $push: { followers: req.body.userId } });
                await currentUser.updateOne({ $push: { followings: req.params.id } });

                res.status(200).json("Пользователь подписался на вас");

            } else {
                res.status(403).json("Ты уже подписан на этого пользователя");
            }

        } catch (err){
            res.status(500).json(err);
        }

    } else {
        res.status(403).json("Ты не можешь подписаться на себя");
    }

});


// Unfollow User
router.put("/:id/unfollow", async (req, res) => {

    if (req.body.userId !== req.params.id) {

        try {

            const user = await User.findById(req.params.id);
            const currentUser = await User.findById(req.body.userId);

            if (user.followers.includes(req.body.userId)) {

                await user.updateOne({ $pull: { followers: req.body.userId } });
                await currentUser.updateOne({ $pull: { followings: req.params.id } });

                res.status(200).json("Пользователь отподписался от вас");

            } else {
                res.status(403).json("Ты уже отподписался от этого пользователя");
            }

        } catch (err){
            res.status(500).json(err);
        }

    } else {
        res.status(403).json("Ты не можешь отподписаться от себя");
    }

});


module.exports = router;