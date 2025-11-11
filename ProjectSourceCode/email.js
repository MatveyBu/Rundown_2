const nodemailer = require('nodemailer');

// Create a transporter object using your email service's SMTP settings
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // e.g., 'smtp.gmail.com'
    port: 587, // or 465 for SSL/TLS
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'dhilonprasad@gmail.com',
        pass: 'dhpr4013!'
    }
});


// Send the email
module.exports = transporter;