const express = require('express');
const path = require('path');
const morgan = require('morgan');
const ejsMate = require('ejs-mate');
const livereload = require('livereload');
const connectLiveReload = require('connect-livereload');
const session = require('express-session');
const MongoStore = require('connect-mongo');
// Flash works along with session
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/userModel');

const userRouter = require('./routes/userRoutes');

const liveReloadServer = livereload.createServer();
liveReloadServer.server.once('connection', () => {
    setTimeout(() => {
        liveReloadServer.refresh('/');
    }, 10);
});

const app = express();

app.engine('ejs', ejsMate);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(connectLiveReload());

const DB = process.env.DB.replace(
    '<DB_USERNAME>',
    process.env.DB_USERNAME
).replace('<DB_PASSWORD>', process.env.DB_PASSWORD);

app.use(
    session({
        name: '_underlying-feeling',
        secret: process.env.SESSION_SECRET,
        store: MongoStore.create({
            mongoUrl: DB,
            touchAfter: 24 * 60 * 60,
            crypto: {
                secret: process.env.SESSION_SECRET,
            },
        }),
        resave: false,
        saveUninitialized: true,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' ? true : false,
            expires:
                Date.now() +
                process.env.SESSION_COOKIE_EXPIRATION * 24 * 60 * 60 * 1000,
            maxAge: process.env.SESSION_COOKIE_EXPIRATION * 24 * 60 * 60 * 1000,
        },
    })
);

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new LocalStrategy({ usernameField: 'email' }, User.authenticate())
);
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(
    express.urlencoded({
        extended: true,
        limit: '10kb',
    })
);

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUser = req.user;

    next();
});

app.use('/users', userRouter);

module.exports = app;
