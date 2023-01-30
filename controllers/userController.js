const User = require('../models/userModel');
const Email = require('../services/nodemailer');
const crypto = require('crypto');

exports.getLoginForm = (req, res) => {
    res.render('login');
};

exports.getSignupForm = (req, res) => {
    res.render('signup');
};

exports.getDashboard = (req, res) => {
    res.render('dashboard');
};

exports.getForgotPasswordForm = (req, res) => {
    res.render('forgotPassword');
};

exports.getNewPasswordForm = async (req, res) => {
    try {
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpiration: { $gt: Date.now() },
        });

        if (!user) {
            throw new Error('Token is invalid or has expired');
        }

        res.render('newPassword', { token: hashedToken });
    } catch (err) {
        req.flash('error', err.message);
        res.redirect('/users/forgotPassword');
    }
};

exports.getChangePasswordForm = (req, res) => {
    res.render('changePassword');
};

exports.signupUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const user = new User({ username, email });

        const registeredUser = await User.register(user, password);

        req.login(registeredUser, err => {
            if (err) {
                throw err;
            }

            req.flash('success', `Welcome ${req.user.username}`);

            res.redirect('/users/dashboard');
        });
    } catch (err) {
        req.flash('error', err.message);
        res.redirect('/users/signup');
    }
};

exports.loginUser = async (req, res) => {
    try {
        req.flash('success', `Welcome back ${req.user.username}`);

        return res.redirect('/users/dashboard');
    } catch (err) {
        req.flash('error', err.message);
        return res.redirect('/users/login');
    }
};

exports.logoutUser = async (req, res) => {
    req.logout(err => {
        if (err) {
            throw err;
        }

        req.flash('success', 'Goodbye!');
        res.redirect('/users/login');
    });
};

exports.userIsAuthenticated = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'You must be logged in to access this page');

        return res.redirect('/users/login');
    }

    next();
};

exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const query = { email };
        const user = await User.findOne(query);

        if (!user) {
            throw new Error('There is no user with that email.');
        }

        // Instance method in schema
        const resetToken = user.createPasswordResetToken();

        await user.save();

        try {
            const protocol = req.protocol;
            const host = req.get('host');

            const resetUrl = `${protocol}://${host}/users/resetPassword/${resetToken}`;
            await new Email(user, resetUrl).sendPasswordReset();

            req.flash('success', 'Email sent with further instructions.');
            res.redirect('/users/forgotPassword');
        } catch (err) {
            user.passwordResetToken = undefined;
            user.passwordResetExpiration = undefined;
            await user.save();

            throw new Error('There was an error sending the email, Try again');
        }
    } catch (err) {
        req.flash('error', err.message);
        return res.redirect('/users/forgotPassword');
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const hashedToken = req.params.token;

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpiration: { $gt: Date.now() },
        });

        if (!user) {
            throw new Error('Token is invalid or has expired');
        }

        const { password, passwordConfirm } = req.body;

        if (password !== passwordConfirm) {
            throw new Error('Passwords do not match');
        }

        await user.setPassword(password);
        user.passwordResetToken = undefined;
        user.passwordResetExpiration = undefined;
        await user.save();

        const protocol = req.protocol;
        const host = req.get('host');

        loginUrl = `${protocol}://${host}/users/login`;

        await new Email(user, loginUrl).sendPasswordResetSuccess();

        req.flash('success', 'Email sent with the confirmation');
        res.redirect('/users/login');
    } catch (err) {
        req.flash('error', err.message);
        return res.redirect('/users/forgotPassword');
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { password, passwordConfirm } = req.body;

        if (password !== passwordConfirm) {
            throw new Error('Passwords do not match');
        }

        const query = { email: req.user.email };

        const user = await User.findOne(query);

        await user.setPassword(password);
        await user.save();

        req.logout(err => {
            if (err) {
                throw err;
            }

            req.flash(
                'success',
                'Password changed successfully, Please log in again.'
            );
            res.redirect('/users/login');
        });
    } catch (err) {
        req.flash('error', err.message);
        return res.redirect('/users/changePassword');
    }
};
