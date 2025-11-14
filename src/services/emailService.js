const nodemailer = require('nodemailer');
const config = require('../config');

const sendEmail = async (to, subject, text, html) => {
  const transporter = nodemailer.createTransport(config.email.transport);

  const mailOptions = {
    from: config.email.from,
    to: to,
    subject: subject,
    text: text,
    html: html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending email: ', error);
    // Re-throw the error to be caught by the calling function
    throw new Error('Error sending email');
  }
};

module.exports = { sendEmail };
