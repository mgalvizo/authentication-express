const mongoose = require('mongoose');
const { Schema } = mongoose;
const passportLocalMongoose = require('passport-local-mongoose');
const crypto = require('crypto');

const userSchema = new Schema({
    username: {
        type: String,
        required: [true, 'A user must have a username'],
        unique: true,
    },
    email: {
        type: String,
        required: [true, 'A user must have an email'],
        unique: true,
    },
    passwordResetToken: {
        type: String,
    },
    passwordResetExpiration: {
        type: Date,
    },
});

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Token encryption
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // 10 minute expiration
    this.passwordResetExpiration = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

const User = mongoose.model('User', userSchema);

module.exports = User;
