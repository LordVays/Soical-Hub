const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require("bcryptjs");


router.post('/register', async (req, res) => {
    
    try {

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        const newUser = new User({
            username: req.body.username,
            age: req.body.age,
            email: req.body.email,
            password: hashedPassword
        });

        const user = await newUser.save();

        res.status(200).json(user);

    } catch (err) {
        res.status(500).json(err);
    }

});


router.post('/login', async (req, res) => {

    try {

        const user = await User.findOne({
            email: req.body.email
        });

        !user && res.status(404).send("Пользователь не найден");  

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        !validPassword && res.status(400).json("Введите правильный пароль");

        res.status(200).json(user);
          
    } catch (err) {
        res.status(500).json(err);
    }

})


module.exports = router;