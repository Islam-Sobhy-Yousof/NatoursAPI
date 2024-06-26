const nodemailer = require('nodemailer');
const catchAsync = require('./catchAsync');

const sendEmail = catchAsync(async (options) => {
  //1) define the transporter

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  //2) define the email options
  const mailOptions = {
    from: 'Islam Sobhy<islamsobhyeladly@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  //3) send the email actually => it returns a promise
  const sendEmail = await transporter.sendMail(mailOptions);
});
module.exports = sendEmail