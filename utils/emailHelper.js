const nodemailer = require("nodemailer");

const mailHelper = async (option) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const message = {
    from: "nags.adiga@gmail.com",
    to: option.toEmail,
    subject: option.subject,
    text: option.message,
    html: `<a href=${option.url}>Click here</a>`,
  };
  await transporter.sendMail(message);
};
module.exports = mailHelper;
