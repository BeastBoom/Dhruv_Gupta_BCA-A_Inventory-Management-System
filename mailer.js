// mailer.js
const nodemailer = require('nodemailer');
require('dotenv').config();

async function sendEmail(to, code) {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Inventory System" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify your email',
    html: `
      <h2>Email Verification</h2>
      <p>Thank you for signing up. Please use the code below to verify your email:</p>
      <h3 style="color:#007BFF;">${code}</h3>
      <p>This code will expire in 1 hour.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${to}`);
  } catch (err) {
    console.error('Email sending failed:', err);
    throw new Error('Email could not be sent.');
  }
}

module.exports = sendEmail;
