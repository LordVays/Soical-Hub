const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require("path");
const session = require('express-session');
const multer = require('multer');
const ejs = require('ejs');

const userRoute = require("./backend/routes/users");
const authRoute = require("./backend/routes/auth");
const postRoute = require("./backend/routes/posts");


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("MongoDB connection error:", err));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'frontend/views'));


// Настройка сессий
app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));


app.use((req, res, next) => {
    res.locals.currentUser = req.session.user;
    res.locals.error = req.session.error;
    res.locals.success = req.session.success; 
    delete req.session.error;
    delete req.session.success;
    next();
});


// Настройка загрузки файлов
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


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "'unsafe-inline'"], 
            "img-src": ["'self'", "data:", "http://localhost:5000", "blob:"], 
        },
    },
}));
app.use(morgan("common"));
app.use(express.static(path.join(__dirname, 'frontend/public')));


// Middleware для проверки аутентификации
const requireAuthFrontend = (req, res, next) => {
    if (!req.session.user) {
        req.session.error = "Пожалуйста, войдите в систему для доступа к этой странице.";
        return res.redirect('/login');
    }
    next();
};


// Routes API
app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute);



app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/home');
    } else {
        res.redirect('/login');
    }
});


// Login Page
app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/home');
    }
    res.render('auth/login', { title: 'Login' });
});


// Register Page
app.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/home');
    }
    res.render('auth/register', { title: 'Register' });
});


// Home Page (Timeline)
app.get('/home', requireAuthFrontend, async (req, res) => {
    try {

        const currentUser = await User.findById(req.session.user._id);
        if (!currentUser) {
            req.session.error = "Пользователь не найден.";
            return res.redirect('/login');
        }

        const userPosts = await Post.find({ userId: currentUser._id }).sort({ createdAt: -1 });
        const friendPostsPromises = currentUser.followings.map(friendId => {
            return Post.find({ userId: friendId }).sort({ createdAt: -1 });
        });

        const friendPostsArrays = await Promise.all(friendPostsPromises);
        const allPosts = userPosts.concat(...friendPostsArrays)
                           .sort((a, b) => b.createdAt - a.createdAt); 

        const populatedPosts = await Promise.all(allPosts.map(async (post) => {
            const author = await User.findById(post.userId).select('username profileAvatar');
            return { ...post.toObject(), author }; 
        }));

        res.render('home', {
            title: 'Home Feed',
            posts: populatedPosts,
            currentUser: req.session.user 
        });

    } catch (err) {
        console.error("Error fetching timeline:", err);
        req.session.error = "Не удалось загрузить ленту.";
        res.render('home', { title: 'Home Feed', posts: [], currentUser: req.session.user });
    }
});


// User Profile Page
app.get('/profile/:userId', requireAuthFrontend, async (req, res) => {
    try {

        const profileUser = await User.findById(req.params.userId).select('-password');
        if (!profileUser) {
            req.session.error = "Профиль пользователя не найден.";
            return res.redirect('/home');
        }
        const posts = await Post.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        const populatedPosts = await Promise.all(posts.map(async (post) => {
             return { ...post.toObject(), author: { username: profileUser.username, profileAvatar: profileUser.profileAvatar } };
        }));

        res.render('users/profile', {
            title: `${profileUser.username}'s Profile`,
            profileUser,
            posts: populatedPosts,
            isCurrentUserProfile: req.session.user._id.toString() === req.params.userId.toString()
        });

    } catch (err) {
        console.error("Error fetching profile:", err);
        req.session.error = "Не удалось загрузить профиль.";
        res.redirect('/home');
    }
});


// Create Post Page/Form 
app.get('/posts/new', requireAuthFrontend, (req, res) => {
    res.render('posts/create', { title: 'Create Post' });
});


// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Session destruction error:", err);
            return res.redirect('/home');
        }
        res.clearCookie('connect.sid'); 
        res.redirect('/login');
    });
});



app.listen(PORT, () => console.log(`Server running on port ${PORT}`));