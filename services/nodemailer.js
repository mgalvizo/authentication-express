const ejs = require('ejs');
const nodemailer = require('nodemailer');
const htmlToText = require('html-to-text');

// Class that can handle emails for different scenarios
class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.username.split(' ')[0];
        this.url = url;
        this.from = `Miguel Garcia <${
            process.env.NODE_ENV === 'production'
                ? process.env.SENDGRID_EMAIL_FROM
                : process.env.EMAIL_FROM
        }>`;
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            // Setup transporter for sendgrid
            const transport = nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD,
                },
            });

            return transport;
        }

        // Create nodemailer transporter
        const transport = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        return transport;
    }

    async sendEmail(template, subject) {
        // Create HTML for email
        const html = await ejs.renderFile(
            `${__dirname}/../views/emails/${template}.ejs`,
            {
                firstName: this.firstName,
                url: this.url,
                subject,
            }
        );

        // Define the email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            // Simple text without html tags
            text: htmlToText.convert(html, { wordwrap: 100 }),
        };

        this.newTransport();

        await this.newTransport().sendMail(mailOptions);
    }

    async sendPasswordReset() {
        await this.sendEmail(
            'passwordReset',
            'Your password reset token is valid only for 10 minutes'
        );
    }

    async sendPasswordResetSuccess() {
        await this.sendEmail(
            'passwordResetSuccess',
            'Your password was reset successfully'
        );
    }
}

module.exports = Email;
