const nodemailer = require('nodemailer');

// Create a transporter object using your email service's SMTP settings
// IMPORTANT: Gmail requires an App Password, not your regular password
// To generate an App Password:
// 1. Go to your Google Account settings
// 2. Enable 2-Step Verification
// 3. Go to App Passwords and generate a new one
// 4. Use that App Password here or set it as an environment variable
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER || '...',
        pass: process.env.EMAIL_PASS || '...' // Should be an App Password, not regular password
    }
});

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('Email transporter verification failed:', error);
        console.error('Make sure you are using a Gmail App Password, not your regular password');
    } else {
        console.log('Email transporter is ready to send emails');
    }
});

// Send the email
module.exports = transporter;