const express = require('express');
const passport = require('passport');
const userController = require('../controllers/userController');

const router = express.Router();

router
    .route('/signup')
    .get(userController.getSignupForm)
    .post(userController.signupUser);

router
    .route('/login')
    .get(userController.getLoginForm)
    .post(
        passport.authenticate('local', {
            failureFlash: true,
            failureRedirect: '/users/login',
            keepSessionInfo: true,
        }),
        userController.loginUser
    );

// It is a good idea to use POST or DELETE requests instead of GET requests for the logout endpoints, in order to prevent accidental or malicious logouts.
router.route('/logout').post(userController.logoutUser);

router
    .route('/forgotPassword')
    .get(userController.getForgotPasswordForm)
    .post(userController.forgotPassword);

router
    .route('/resetPassword/:token')
    .get(userController.getNewPasswordForm)
    .post(userController.resetPassword);

// Require login for the routes from this point
router.use(userController.userIsAuthenticated);

router.route('/dashboard').get(userController.getDashboard);

router
    .route('/changePassword')
    .get(userController.getChangePasswordForm)
    .post(userController.changePassword);

module.exports = router;
